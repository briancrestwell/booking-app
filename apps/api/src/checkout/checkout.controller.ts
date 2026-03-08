import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { CheckoutService } from './checkout.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':tableId')
  confirm(
    @Param('tableId', ParseUUIDPipe) tableId: string,
    @Body('method') method: PaymentMethod,
    @CurrentUser() user: { id: string },
  ) {
    return this.checkoutService.confirmPayment(tableId, user.id, method);
  }
}
