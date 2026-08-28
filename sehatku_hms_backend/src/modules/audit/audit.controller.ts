import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan riwayat audit trail aktivitas dan mutasi data' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'action', required: false })
  findAll(
    @Query('query') query?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.findAll(query, action);
  }
}
