import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.service';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { OrderModule } from './order/order.module';
import { MenuModule } from './menu/menu.module';
import { GatewayModule } from './gateway/gateway.module';
import { TableModule } from './table/table.module';
import { CheckoutModule } from './checkout/checkout.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    // ── Config: validates env vars at startup ────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        const required = ['DATABASE_URL'];
        for (const key of required) {
          if (!env[key]) throw new Error(`Missing required env var: ${key}`);
        }
        return env;
      },
    }),

    // ── Rate limiting: 60 req / 60 s per IP ─────────────────────────────
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    PrismaModule,
    RedisModule,
    AuthModule,
    BookingModule,
    OrderModule,
    MenuModule,
    GatewayModule,
    TableModule,
    CheckoutModule,
    AuditModule,
  ],
  providers: [
    // Apply rate limiting globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
