import { Injectable, NotFoundException } from '@nestjs/common';
import { TableStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantGateway } from '../gateway/restaurant.gateway';

@Injectable()
export class TableService {
  constructor(
    private readonly prisma:   PrismaService,
    private readonly gateway:  RestaurantGateway,
  ) {}

  async listByBranch(branchId: string) {
    return this.prisma.table.findMany({
      where:   { branchId, isActive: true },
      orderBy: [{ section: 'asc' }, { number: 'asc' }],
      include: {
        orders: {
          where:   { status: { notIn: ['SERVED', 'CANCELLED'] } },
          orderBy: { createdAt: 'asc' },
          include: { items: { include: { menuItem: { select: { id: true, name: true } } } } },
        },
        bookings: {
          where:   { status: { in: ['CONFIRMED', 'SEATED'] } },
          orderBy: { scheduledAt: 'asc' },
          take:    1,
          select:  { id: true, guestCount: true, scheduledAt: true, status: true,
                     user: { select: { firstName: true, lastName: true, phone: true } } },
        },
      },
    });
  }

  async updateStatus(tableId: string, status: TableStatus, branchId?: string) {
    const table = await this.prisma.table.findUnique({
      where:  { id: tableId },
      select: { id: true, branchId: true },
    });
    if (!table) throw new NotFoundException('Table not found');

    const updated = await this.prisma.table.update({
      where: { id: tableId },
      data:  { status },
    });

    this.gateway.emitTableStatusChanged({
      tableId,
      status,
      branchId: branchId ?? table.branchId,
    });

    return updated;
  }

  async create(branchId: string, data: { number: number; section?: string; capacity: number }) {
    return this.prisma.table.create({ data: { branchId, ...data } });
  }
}
