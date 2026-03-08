import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { TableStatus } from '@prisma/client';
import { TableService } from './table.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get()
  list(@Query('branchId') branchId: string) {
    return this.tableService.listByBranch(branchId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TableStatus,
    @Body('branchId') branchId?: string,
  ) {
    return this.tableService.updateStatus(id, status, branchId);
  }

  @Post()
  create(
    @Body('branchId') branchId: string,
    @Body('number') number: number,
    @Body('capacity') capacity: number,
    @Body('section') section?: string,
  ) {
    return this.tableService.create(branchId, { number, section, capacity });
  }
}
