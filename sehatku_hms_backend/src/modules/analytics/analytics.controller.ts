import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Clinic Analytics & Reports')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('daily-report')
  @ApiOperation({ summary: 'Laporan harian performa kasir, omzet & obat terlaris klinik' })
  @ApiResponse({ status: 200, description: 'Berhasil memuat laporan harian' })
  getDailyReport() {
    return this.analyticsService.getDailyClinicReport();
  }
}
