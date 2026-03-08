import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantGateway } from '../gateway/restaurant.gateway';
import { PlaceOrderDto, UpdateOrderStatusDto } from './order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly gateway: RestaurantGateway,
  ) {}

  // ---------------------------------------------------------------------------
  // placeOrder — Serializable tx (fix: was ReadCommitted)
  // ---------------------------------------------------------------------------
  async placeOrder(dto: PlaceOrderDto, userId: string) {
    const menuItemIds = dto.items.map((i) => i.menuItemId);

    const menuItems = await this.prisma.menuItem.findMany({
      where:  { id: { in: menuItemIds }, isActive: true },
      select: { id: true, name: true, priceSatang: true, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      const foundIds = new Set(menuItems.map((m) => m.id));
      const missing  = menuItemIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(`Menu items not found: ${missing.join(', ')}`);
    }

    const unavailable = menuItems.filter((m) => !m.isAvailable);
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `Items unavailable: ${unavailable.map((m) => m.name).join(', ')}`,
      );
    }

    const priceMap    = new Map(menuItems.map((m) => [m.id, m.priceSatang]));
    const totalSatang = dto.items.reduce(
      (sum, item) => sum + (priceMap.get(item.menuItemId) ?? 0) * item.quantity, 0,
    );

    const order = await this.prisma.$transaction(
      async (tx) => {
        return tx.order.create({
          data: {
            tableId:   dto.tableId,
            userId,
            bookingId: dto.bookingId ?? null,
            notes:     dto.notes,
            totalSatang,
            status:    OrderStatus.PENDING,
            items: {
              create: dto.items.map((item) => ({
                menuItemId: item.menuItemId,
                quantity:   item.quantity,
                notes:      item.notes,
                unitSatang: priceMap.get(item.menuItemId)!,
              })),
            },
          },
          include: {
            items: { include: { menuItem: { select: { id: true, name: true, imageUrl: true } } } },
            table: { select: { id: true, number: true, section: true, branchId: true } },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }, // ← fixed from ReadCommitted
    );

    this.gateway.emitNewOrderKitchen({
      orderId:      order.id,
      tableId:      order.tableId,
      tableNumber:  order.table.number,
      tableSection: order.table.section ?? undefined,
      branchId:     order.table.branchId,
      items:        order.items.map((i) => ({
        name:     i.menuItem.name,
        quantity: i.quantity,
        notes:    i.notes ?? undefined,
      })),
      totalSatang,
      createdAt: order.createdAt.toISOString(),
    });

    this.logger.log(`Order placed: ${order.id} on table ${dto.tableId}`);
    return order;
  }

  // ---------------------------------------------------------------------------
  // updateOrderStatus — wrapped in $transaction
  // ---------------------------------------------------------------------------
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where:  { id: orderId },
        select: { id: true, status: true, tableId: true, table: { select: { branchId: true } } },
      });
      if (!order) throw new NotFoundException('Order not found');

      return tx.order.update({
        where: { id: orderId },
        data:  { status: dto.status as OrderStatus },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // Fetch branchId for scoped emit
    const order = await this.prisma.order.findUnique({
      where:  { id: orderId },
      select: { tableId: true, table: { select: { branchId: true } } },
    });

    this.gateway.emitOrderStatusChanged({
      orderId,
      status:   dto.status,
      tableId:  order?.tableId ?? '',
      branchId: order?.table.branchId,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // markTableServed — mark all active orders as SERVED
  // ---------------------------------------------------------------------------
  async markTableServed(tableId: string) {
    const result = await this.prisma.order.updateMany({
      where: { tableId, status: { notIn: [OrderStatus.SERVED, OrderStatus.CANCELLED] } },
      data:  { status: OrderStatus.SERVED },
    });
    return { updated: result.count };
  }

  // ---------------------------------------------------------------------------
  // findActiveForKDS — pending/preparing orders across a branch
  // ---------------------------------------------------------------------------
  async findActiveForKDS(branchId: string) {
    return this.prisma.order.findMany({
      where: {
        table:  { branchId },
        status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: { include: { menuItem: { select: { id: true, name: true } } } },
        table: { select: { id: true, number: true, section: true } },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  async findByTable(tableId: string) {
    return this.prisma.order.findMany({
      where:   { tableId, status: { notIn: [OrderStatus.SERVED, OrderStatus.CANCELLED] } },
      orderBy: { createdAt: 'asc' },
      include: { items: { include: { menuItem: true } } },
    });
  }

  async findByBooking(bookingId: string) {
    return this.prisma.order.findMany({
      where:   { bookingId },
      orderBy: { createdAt: 'asc' },
      include: { items: { include: { menuItem: true } } },
    });
  }
}
