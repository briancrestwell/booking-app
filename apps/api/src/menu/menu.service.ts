import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantGateway } from '../gateway/restaurant.gateway';

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly gateway: RestaurantGateway,
  ) {}

  // ── Public read ────────────────────────────────────────────────────────────

  async getCategoriesWithItems(branchId: string) {
    return this.prisma.category.findMany({
      where:   { branchId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where:   { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true, name: true, description: true, imageUrl: true,
            priceSatang: true, isAvailable: true, tags: true,
          },
        },
      },
    });
  }

  async getMenuItem(itemId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where:   { id: itemId },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async searchItems(branchId: string, query: string) {
    const q = query.slice(0, 100); // limit length
    return this.prisma.$queryRaw<
      { id: string; name: string; priceSatang: number; isAvailable: boolean }[]
    >`
      SELECT mi.id, mi.name, mi."priceSatang", mi."isAvailable"
      FROM menu_items mi
      JOIN categories c ON c.id = mi."categoryId"
      WHERE c."branchId" = ${branchId}
        AND c."isActive" = true
        AND mi."isActive" = true
        AND (mi.name % ${q} OR mi.description % ${q})
      ORDER BY similarity(mi.name, ${q}) DESC
      LIMIT 20
    `;
  }

  // ── Admin: Category CRUD ───────────────────────────────────────────────────

  async createCategory(branchId: string, name: string, description?: string) {
    return this.prisma.category.create({ data: { branchId, name, description } });
  }

  async updateCategory(catId: string, data: { name?: string; description?: string; sortOrder?: number }) {
    const cat = await this.prisma.category.findUnique({ where: { id: catId } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id: catId }, data });
  }

  async deleteCategory(catId: string) {
    const cat = await this.prisma.category.findUnique({ where: { id: catId } });
    if (!cat) throw new NotFoundException('Category not found');
    // Soft delete
    return this.prisma.category.update({ where: { id: catId }, data: { isActive: false } });
  }

  // ── Admin: MenuItem CRUD ───────────────────────────────────────────────────

  async createItem(data: {
    categoryId:  string;
    name:        string;
    description?: string;
    imageUrl?:   string;
    priceSatang: number;
    tags?:       string[];
  }) {
    const item = await this.prisma.menuItem.create({ data });
    this.gateway.emitMenuUpdated({ action: 'created', itemId: item.id });
    return item;
  }

  async updateItem(itemId: string, data: Partial<{
    name:        string;
    description: string;
    imageUrl:    string;
    priceSatang: number;
    categoryId:  string;
    sortOrder:   number;
    tags:        string[];
  }>) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    const updated = await this.prisma.menuItem.update({ where: { id: itemId }, data });
    this.gateway.emitMenuUpdated({ action: 'updated', itemId });
    return updated;
  }

  async toggle86(itemId: string, isAvailable: boolean) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    const updated = await this.prisma.menuItem.update({
      where: { id: itemId },
      data:  { isAvailable },
    });
    this.gateway.emitMenuUpdated({ action: 'toggle86', itemId, isAvailable });
    return updated;
  }

  async deleteItem(itemId: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Menu item not found');
    const updated = await this.prisma.menuItem.update({
      where: { id: itemId },
      data:  { isActive: false },
    });
    this.gateway.emitMenuUpdated({ action: 'deleted', itemId });
    return updated;
  }
}
