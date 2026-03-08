import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin:      process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Global guards ─────────────────────────────────────────────────────────
  // JWT guard is the default; routes opt-out with @Public()
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // ── Global exception filter ───────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();
  const prismaService = (app as any).get?.('PrismaService');
  if (prismaService?.enableShutdownHooks) {
    await prismaService.enableShutdownHooks(app);
  }

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`✅ API running on http://localhost:${port}/api/v1`);
}

bootstrap();
