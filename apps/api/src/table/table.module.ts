import { Module } from '@nestjs/common';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:     [PrismaModule, GatewayModule, AuthModule],
  controllers: [TableController],
  providers:   [TableService],
  exports:     [TableService],
})
export class TableModule {}
