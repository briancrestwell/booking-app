import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

export interface LogAuditInput {
  branchId?:  string;
  userId?:    string;
  action:     string;
  category:   string;
  targetType?: string;
  targetId?:  string;
  outcome:    'SUCCESS' | 'FAILURE';
  meta?:      Record<string, unknown>;
  req?:       Request;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogAuditInput) {
    return this.prisma.auditLog.create({
      data: {
        branchId:   input.branchId,
        userId:     input.userId,
        action:     input.action,
        category:   input.category,
        targetType: input.targetType,
        targetId:   input.targetId,
        outcome:    input.outcome,
        meta:       input.meta as any,
        ipAddress:  input.req?.ip,
        userAgent:  input.req?.headers['user-agent'],
      },
    });
  }

  async findByBranch(branchId: string, limit = 100, offset = 0) {
    return this.prisma.auditLog.findMany({
      where:   { branchId },
      orderBy: { createdAt: 'desc' },
      take:    Math.min(limit, 500),
      skip:    offset,
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    Math.min(limit, 200),
    });
  }
}
