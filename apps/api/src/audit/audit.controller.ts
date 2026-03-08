import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findByBranch(
    @Query('branchId') branchId: string,
    @Query('limit')    limit?:   string,
    @Query('offset')   offset?:  string,
  ) {
    return this.auditService.findByBranch(
      branchId,
      limit  ? parseInt(limit)  : 100,
      offset ? parseInt(offset) : 0,
    );
  }
}
