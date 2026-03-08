import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:     [PrismaModule, GatewayModule, AuthModule],
  controllers: [CheckoutController],
  providers:   [CheckoutService],
})
export class CheckoutModule {}
