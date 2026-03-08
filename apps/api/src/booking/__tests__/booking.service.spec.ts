import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookingService } from '../booking.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RestaurantGateway } from '../../gateway/restaurant.gateway';
import { TableStatus, BookingStatus } from '@prisma/client';

const mockPrisma = {
  $transaction: jest.fn(),
  booking:      { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  table:        { findUnique: jest.fn(), update: jest.fn() },
  timeSlot:     { findUnique: jest.fn() },
};
const mockRedis   = { bookingLockKey: jest.fn().mockReturnValue('lock:key'), acquireLock: jest.fn(), releaseLock: jest.fn() };
const mockGateway = { emitTableStatusChanged: jest.fn(), emitBookingConfirmed: jest.fn(), emitBookingCancelled: jest.fn() };

describe('BookingService', () => {
  let service: BookingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService,       useValue: mockPrisma },
        { provide: RedisService,        useValue: mockRedis },
        { provide: RestaurantGateway,   useValue: mockGateway },
      ],
    }).compile();
    service = module.get(BookingService);
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    const dto = { tableId: 't1', slotId: 's1', guestCount: 2, specialRequests: '' };
    const userId = 'u1';

    it('throws ConflictException when Redis lock not acquired', async () => {
      mockRedis.acquireLock.mockResolvedValue(null);
      await expect(service.createBooking(dto, userId)).rejects.toThrow(ConflictException);
    });

    it('always releases Redis lock even when transaction throws', async () => {
      mockRedis.acquireLock.mockResolvedValue('token');
      mockPrisma.$transaction.mockRejectedValue(new Error('DB error'));
      await expect(service.createBooking(dto, userId)).rejects.toThrow('DB error');
      expect(mockRedis.releaseLock).toHaveBeenCalledTimes(1);
    });

    it('creates booking and emits socket events on success', async () => {
      mockRedis.acquireLock.mockResolvedValue('token');
      const fakeBooking = {
        id: 'b1', tableId: 't1', branchId: 'br1',
        table: { id: 't1', number: 1, section: null },
        slot:  { id: 's1', label: 'Dinner', startTime: new Date(), endTime: new Date() },
        user:  { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com' },
      };
      mockPrisma.$transaction.mockResolvedValue(fakeBooking);
      const result = await service.createBooking(dto, userId);
      expect(result).toEqual(fakeBooking);
      expect(mockGateway.emitTableStatusChanged).toHaveBeenCalledWith(
        expect.objectContaining({ tableId: 't1', status: TableStatus.RESERVED }),
      );
      expect(mockGateway.emitBookingConfirmed).toHaveBeenCalledWith(
        expect.objectContaining({ bookingId: 'b1' }),
      );
      expect(mockRedis.releaseLock).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelBooking', () => {
    it('performs all guards inside transaction (no TOCTOU)', async () => {
      // The transaction callback receives a tx client — ensure we use tx, not top-level prisma
      const fakeResult = { cancelled: { id: 'b1', status: BookingStatus.CANCELLED }, tableId: 't1', branchId: 'br1' };
      mockPrisma.$transaction.mockResolvedValue(fakeResult);
      await service.cancelBooking('b1', 'u1');
      // $transaction must be called (guards are inside it)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      // Top-level booking.findUnique must NOT be called (was the TOCTOU bug)
      expect(mockPrisma.booking.findUnique).not.toHaveBeenCalled();
    });
  });
});
