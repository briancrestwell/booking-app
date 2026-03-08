import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly jwt:     JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email:        dto.email,
        passwordHash,
        firstName:    dto.firstName,
        lastName:     dto.lastName,
        phone:        dto.phone,
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });

    this.logger.log(`New user registered: ${user.email}`);
    return { user, accessToken: this.sign(user.id, user.email, user.role) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where:  { email: dto.email },
      select: { id: true, email: true, passwordHash: true, role: true, isActive: true, firstName: true, lastName: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    this.logger.log(`Login: ${user.email}`);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, accessToken: this.sign(user.id, user.email, user.role) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, avatarUrl: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private sign(sub: string, email: string, role: string) {
    return this.jwt.sign({ sub, email, role });
  }
}
