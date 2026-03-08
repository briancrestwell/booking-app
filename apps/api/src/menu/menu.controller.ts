import {
  Body, Controller, Delete, Get, Param,
  ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ── Public read ────────────────────────────────────────────────────────────

  @Public()
  @Get('branch/:branchId')
  getCatalog(@Param('branchId', ParseUUIDPipe) branchId: string) {
    return this.menuService.getCategoriesWithItems(branchId);
  }

  @Public()
  @Get('branch/:branchId/search')
  search(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Query('q') query: string,
  ) {
    return this.menuService.searchItems(branchId, query ?? '');
  }

  @Public()
  @Get('items/:id')
  getItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.getMenuItem(id);
  }

  // ── Admin: Category CRUD ───────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('categories')
  createCategory(
    @Body('branchId') branchId: string,
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.menuService.createCategory(branchId, name, description);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { name?: string; description?: string; sortOrder?: number },
  ) {
    return this.menuService.updateCategory(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.deleteCategory(id);
  }

  // ── Admin: MenuItem CRUD ───────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('items')
  createItem(
    @Body() data: {
      categoryId: string; name: string; priceSatang: number;
      description?: string; imageUrl?: string; tags?: string[];
    },
  ) {
    return this.menuService.createItem(data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:id')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<{
      name: string; description: string; imageUrl: string;
      priceSatang: number; categoryId: string; sortOrder: number; tags: string[];
    }>,
  ) {
    return this.menuService.updateItem(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:id/availability')
  toggle86(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.menuService.toggle86(id, isAvailable);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:id')
  deleteItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.deleteItem(id);
  }
}
