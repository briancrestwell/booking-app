import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { GatewayModule } from '../gateway/gateway.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports:     [PrismaModule, GatewayModule, AuthModule],
  controllers: [OrderController],
  providers:   [OrderService],
  exports:     [OrderService],
})
export class OrderModule {}
