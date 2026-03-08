import {
  Body, Controller, Get, Param,
  ParseUUIDPipe, Patch, Post, Query, UseGuards, UsePipes,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  PlaceOrderDto, PlaceOrderSchema,
  UpdateOrderStatusDto, UpdateOrderStatusSchema,
} from './order.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(PlaceOrderSchema))
  placeOrder(
    @Body() dto: PlaceOrderDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.orderService.placeOrder(dto, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema)) dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(id, dto);
  }

  @Get()
  findByTable(@Query('tableId', ParseUUIDPipe) tableId: string) {
    return this.orderService.findByTable(tableId);
  }

  @Get('active')
  findActive(@Query('branchId') branchId: string) {
    return this.orderService.findActiveForKDS(branchId);
  }

  @Patch('table/:tableId/serve-all')
  markTableServed(@Param('tableId', ParseUUIDPipe) tableId: string) {
    return this.orderService.markTableServed(tableId);
  }

  @Get('booking/:bookingId')
  findByBooking(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.orderService.findByBooking(bookingId);
  }
}
