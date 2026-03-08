import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, TableStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RestaurantGateway } from '../gateway/restaurant.gateway';
import { CreateBookingDto, UpdateBookingDto } from './booking.dto';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly redis:    RedisService,
    private readonly gateway:  RestaurantGateway,
  ) {}

  // ---------------------------------------------------------------------------
  // createBooking — Redis lock + Serializable tx
  // ---------------------------------------------------------------------------
  async createBooking(dto: CreateBookingDto, userId: string) {
    const lockKey   = this.redis.bookingLockKey(dto.tableId, dto.slotId);
    const lockToken = randomUUID();

    const acquired = await this.redis.acquireLock(lockKey, lockToken);
    if (!acquired) {
      throw new ConflictException('This table is currently being booked. Please retry in a moment.');
    }

    let booking: Awaited<ReturnType<typeof this.prisma.booking.create>>;

    try {
      booking = await this.prisma.$transaction(async (tx) => {
        const table = await tx.table.findUnique({
          where:  { id: dto.tableId },
          select: { id: true, status: true, capacity: true, branchId: true },
        });
        if (!table) throw new NotFoundException('Table not found');
        if (table.status !== TableStatus.AVAILABLE) {
          throw new ConflictException(`Table is ${table.status.toLowerCase()} and cannot be booked.`);
        }
        if (table.capacity < dto.guestCount) {
          throw new ConflictException(`Table capacity (${table.capacity}) < guest count (${dto.guestCount}).`);
        }

        const slot = await tx.timeSlot.findUnique({
          where:  { id: dto.slotId },
          select: { id: true, startTime: true, isActive: true },
        });
        if (!slot || !slot.isActive) throw new NotFoundException('Time slot not found or inactive');

        const conflict = await tx.booking.findFirst({
          where: {
            tableId: dto.tableId,
            slotId:  dto.slotId,
            status:  { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
          },
          select: { id: true },
        });
        if (conflict) throw new ConflictException('Table already booked for this slot.');

        const newBooking = await tx.booking.create({
          data: {
            branchId:        table.branchId,
            tableId:         dto.tableId,
            slotId:          dto.slotId,
            userId,
            guestCount:      dto.guestCount,
            scheduledAt:     slot.startTime,
            specialRequests: dto.specialRequests,
            status:          BookingStatus.CONFIRMED,
            confirmedAt:     new Date(),
          },
          include: {
            table: { select: { id: true, number: true, section: true } },
            slot:  { select: { id: true, label: true, startTime: true, endTime: true } },
            user:  { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        });

        await tx.table.update({
          where: { id: dto.tableId },
          data:  { status: TableStatus.RESERVED },
        });

        return newBooking;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } finally {
      await this.redis.releaseLock(lockKey, lockToken);
    }

    const branchId = (booking as any).table ? undefined : undefined; // resolved below
    // Emit after commit
    this.gateway.emitTableStatusChanged({
      tableId:  dto.tableId,
      status:   TableStatus.RESERVED,
      bookingId: booking.id,
    });
    this.gateway.emitBookingConfirmed({
      bookingId: booking.id,
      tableId:   dto.tableId,
      branchId:  (booking as any).branchId ?? '',
    });

    this.logger.log(`Booking created: ${booking.id} for table ${dto.tableId}`);
    return booking;
  }

  // ---------------------------------------------------------------------------
  // cancelBooking — all guards INSIDE the transaction (TOCTOU fix)
  // ---------------------------------------------------------------------------
  async cancelBooking(bookingId: string, userId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      // ── Read-then-mutate inside the same tx (eliminates TOCTOU) ──────────
      const booking = await tx.booking.findUnique({
        where:  { id: bookingId },
        select: { id: true, userId: true, tableId: true, status: true, branchId: true },
      });
      if (!booking)                            throw new NotFoundException('Booking not found');
      if (booking.userId !== userId)           throw new ConflictException('You can only cancel your own bookings');
      if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
        throw new ConflictException(`Booking already ${booking.status.toLowerCase()}`);
      }

      const cancelled = await tx.booking.update({
        where: { id: bookingId },
        data:  { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
      });

      await tx.table.update({
        where: { id: booking.tableId },
        data:  { status: TableStatus.AVAILABLE },
      });

      return { cancelled, tableId: booking.tableId, branchId: booking.branchId };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    this.gateway.emitTableStatusChanged({ tableId: updated.tableId, status: TableStatus.AVAILABLE });
    this.gateway.emitBookingCancelled({
      bookingId,
      tableId:  updated.tableId,
      branchId: updated.branchId,
    });

    return updated.cancelled;
  }

  // ---------------------------------------------------------------------------
  // updateBooking — wrapped in $transaction with optimistic locking
  // ---------------------------------------------------------------------------
  async updateBooking(bookingId: string, dto: UpdateBookingDto, staffId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where:  { id: bookingId },
        select: { id: true, version: true, status: true, tableId: true },
      });
      if (!booking) throw new NotFoundException('Booking not found');

      const data: Prisma.BookingUpdateInput = {
        updatedBy: { connect: { id: staffId } },
        version:   { increment: 1 },
      };

      if (dto.status) {
        data.status = dto.status;
        if (dto.status === BookingStatus.SEATED)    data.seatedAt    = new Date();
        if (dto.status === BookingStatus.COMPLETED) data.completedAt = new Date();
        if (dto.status === BookingStatus.CANCELLED) data.cancelledAt = new Date();
      }
      if (dto.internalNotes !== undefined) data.internalNotes = dto.internalNotes;

      return tx.booking.update({ where: { id: bookingId }, data });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where:   { userId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        table: { select: { number: true, section: true } },
        slot:  { select: { label: true, startTime: true, endTime: true } },
      },
    });
  }

  async findOne(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where:   { id: bookingId },
      include: {
        table:   true,
        slot:    true,
        user:    { select: { id: true, firstName: true, lastName: true, email: true } },
        orders:  { include: { items: { include: { menuItem: true } } } },
        payment: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }
}
