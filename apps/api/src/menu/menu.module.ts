import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:     [PrismaModule, GatewayModule, AuthModule],
  controllers: [MenuController],
  providers:   [MenuService],
  exports:     [MenuService],
})
export class MenuModule {}
