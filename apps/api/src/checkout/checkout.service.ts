import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus, TableStatus, Prisma, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantGateway } from '../gateway/restaurant.gateway';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly gateway: RestaurantGateway,
  ) {}

  async confirmPayment(tableId: string, userId: string, method: PaymentMethod = PaymentMethod.CASH) {
    // ── 1. Validate table ───────────────────────────────────────────────────
    const table = await this.prisma.table.findUnique({
      where:  { id: tableId },
      select: { id: true, branchId: true, status: true },
    });
    if (!table) throw new NotFoundException('Table not found');

    // ── 2. Get all unpaid orders for this table ─────────────────────────────
    const orders = await this.prisma.order.findMany({
      where:  { tableId, status: { notIn: [OrderStatus.CANCELLED] } },
      select: { id: true, totalSatang: true },
    });
    if (orders.length === 0) throw new BadRequestException('No orders to pay for this table');

    const totalSatang = orders.reduce((s, o) => s + o.totalSatang, 0);

    // ── 3. Atomic transaction ────────────────────────────────────────────────
    const payment = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Mark all orders as SERVED
        await tx.order.updateMany({
          where: { id: { in: orders.map((o) => o.id) } },
          data:  { status: OrderStatus.SERVED },
        });

        // Create payment record
        const pay = await tx.payment.create({
          data: {
            userId,
            amountSatang: totalSatang,
            method,
            status:  PaymentStatus.COMPLETED,
            paidAt:  new Date(),
            orderId: orders[0].id,
          },
        });

        // Free the table
        await tx.table.update({
          where: { id: tableId },
          data:  { status: TableStatus.AVAILABLE },
        });

        return pay;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // ── 4. Emit socket events after commit ───────────────────────────────────
    this.gateway.emitTableStatusChanged({ tableId, status: TableStatus.AVAILABLE, branchId: table.branchId });
    this.gateway.emitPaymentCompleted({ tableId, totalSatang, paymentId: payment.id });

    this.logger.log(`Payment confirmed: table ${tableId}, total ${totalSatang} satang`);
    return { payment, totalSatang };
  }
}
