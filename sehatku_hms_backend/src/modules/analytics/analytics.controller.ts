import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
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

  @Get('morbi-lb1-summary')
  @ApiOperation({ summary: 'Ringkasan data 10 Besar Penyakit / Morbiditas (LB1 Dinkes)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getMorbiLB1Summary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getMorbiLB1Summary(startDate, endDate);
  }

  @Get('export/financial')
  @ApiOperation({ summary: 'Export Laporan Rekapitulasi Kasir & Keuangan ke file CSV / Excel' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportFinancial(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const csvData = await this.analyticsService.exportFinancialCsv(startDate, endDate);
    const filename = `Laporan_Keuangan_Kasir_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  }

  @Get('export/morbi-lb1')
  @ApiOperation({ summary: 'Export Laporan 10 Besar Penyakit (LB1 Dinkes) ke file CSV / Excel' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportMorbiLB1(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const csvData = await this.analyticsService.exportMorbiLB1Csv(startDate, endDate);
    const filename = `Laporan_LB1_10_Penyakit_Dinkes_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  }

  @Get('export/pharmacy-stock')
  @ApiOperation({ summary: 'Export Laporan Mutasi & Valuasi Stok Farmasi ke file CSV / Excel' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportPharmacyStock(@Res() res: Response) {
    const csvData = await this.analyticsService.exportPharmacyStockCsv();
    const filename = `Laporan_Valuasi_Stok_Farmasi_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  }

  @Get('export/patient-visits')
  @ApiOperation({ summary: 'Export Laporan Rekapitulasi Kunjungan Pasien ke file CSV / Excel' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportPatientVisits(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const csvData = await this.analyticsService.exportPatientVisitsCsv(startDate, endDate);
    const filename = `Laporan_Kunjungan_Pasien_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  }
}
