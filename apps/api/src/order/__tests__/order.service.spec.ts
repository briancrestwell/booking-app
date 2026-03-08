import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from '../order.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RestaurantGateway } from '../../gateway/restaurant.gateway';
import { OrderStatus } from '@prisma/client';

const mockPrisma = {
  $transaction: jest.fn(),
  menuItem: { findMany: jest.fn() },
  order:    { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
};
const mockGateway = { emitNewOrderKitchen: jest.fn(), emitOrderStatusChanged: jest.fn() };

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService,     useValue: mockPrisma },
        { provide: RestaurantGateway, useValue: mockGateway },
      ],
    }).compile();
    service = module.get(OrderService);
    jest.clearAllMocks();
  });

  describe('placeOrder', () => {
    const dto = {
      tableId: 't1',
      items: [{ menuItemId: 'm1', quantity: 2, notes: '' }],
    };

    it('throws NotFoundException when menu item not found', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([]);
      await expect(service.placeOrder(dto, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when item not available', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'm1', name: 'Bánh Tráng', priceSatang: 50000, isAvailable: false },
      ]);
      await expect(service.placeOrder(dto, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('uses Serializable isolation level', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'm1', name: 'Bánh Tráng', priceSatang: 50000, isAvailable: true },
      ]);
      const fakeOrder = {
        id: 'o1', tableId: 't1', createdAt: new Date(),
        items: [{ menuItem: { id: 'm1', name: 'Bánh Tráng', imageUrl: null }, quantity: 2, notes: null }],
        table: { id: 't1', number: 1, section: null, branchId: 'br1' },
      };
      mockPrisma.$transaction.mockResolvedValue(fakeOrder);
      await service.placeOrder(dto, 'u1');
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ isolationLevel: 'Serializable' }),
      );
    });

    it('emits kitchen event after transaction', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'm1', name: 'Bánh Tráng', priceSatang: 50000, isAvailable: true },
      ]);
      const fakeOrder = {
        id: 'o1', tableId: 't1', createdAt: new Date(),
        items: [{ menuItem: { id: 'm1', name: 'Bánh Tráng', imageUrl: null }, quantity: 2, notes: null }],
        table: { id: 't1', number: 1, section: null, branchId: 'br1' },
      };
      mockPrisma.$transaction.mockResolvedValue(fakeOrder);
      await service.placeOrder(dto, 'u1');
      expect(mockGateway.emitNewOrderKitchen).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateOrderStatus', () => {
    it('wraps update in a $transaction', async () => {
      mockPrisma.$transaction.mockResolvedValue({ id: 'o1', status: OrderStatus.PREPARING, tableId: 't1' });
      mockPrisma.order.findUnique.mockResolvedValue({ tableId: 't1', table: { branchId: 'br1' } });
      await service.updateOrderStatus('o1', { status: 'PREPARING' });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
