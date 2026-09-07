import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CollectLabSampleDto,
  CreateLabOrderDto,
  CreateLabTestCatalogDto,
  SubmitLabResultsDto,
  VerifyLabOrderDto,
} from './dto/laboratory.dto';
import { LaboratoryService } from './laboratory.service';

@ApiTags('Laboratory & Diagnostics (LIS)')
@Controller('laboratory')
export class LaboratoryController {
  constructor(private readonly labService: LaboratoryService) {}

  // ===================== CATALOG =====================

  @Get('catalog')
  @ApiOperation({ summary: 'Daftar katalog pemeriksaan laboratorium & diagnostik' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter kategori (Hematologi, Kimia Klinik, Urinalisis, dll)' })
  @ApiQuery({ name: 'query', required: false, description: 'Pencarian nama/kode tes' })
  getCatalog(
    @Query('category') category?: string,
    @Query('query') query?: string,
  ) {
    return this.labService.getCatalog(category, query);
  }

  @Post('catalog')
  @ApiOperation({ summary: 'Tambah parameter tes laboratorium baru ke katalog' })
  @ApiBody({ type: CreateLabTestCatalogDto })
  @ApiResponse({ status: 201, description: 'Katalog berhasil dibuat' })
  createCatalog(@Body() dto: CreateLabTestCatalogDto) {
    return this.labService.createCatalog(dto);
  }

  // ===================== ORDERS =====================

  @Get('orders')
  @ApiOperation({ summary: 'Daftar order pemeriksaan laboratorium' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter status (ordered, sample_collected, in_progress, completed)' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter prioritas (Normal, CITO)' })
  @ApiQuery({ name: 'query', required: false, description: 'Pencarian nama pasien, No RM, No Order Lab, DPJP' })
  getOrders(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('query') query?: string,
  ) {
    return this.labService.getOrders(status, priority, query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Detail lengkap order laboratorium dan parameter hasil uji' })
  @ApiParam({ name: 'id', description: 'ID Order Lab' })
  getOrderDetail(@Param('id') id: string) {
    return this.labService.getOrderDetail(id);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Buat order permintaan laboratorium baru oleh dokter' })
  @ApiBody({ type: CreateLabOrderDto })
  @ApiResponse({ status: 201, description: 'Order laboratorium berhasil dibuat' })
  createOrder(@Body() dto: CreateLabOrderDto) {
    return this.labService.createOrder(dto);
  }

  @Patch('orders/:id/sample')
  @ApiOperation({ summary: 'Tandai sampel darah/urin telah diambil oleh analis/perawat' })
  @ApiParam({ name: 'id', description: 'ID Order Lab' })
  @ApiBody({ type: CollectLabSampleDto })
  collectSample(
    @Param('id') id: string,
    @Body() dto: CollectLabSampleDto,
  ) {
    return this.labService.collectSample(id, dto);
  }

  @Post('orders/:id/results')
  @ApiOperation({ summary: 'Entri hasil pemeriksaan lab oleh analis laboratorium' })
  @ApiParam({ name: 'id', description: 'ID Order Lab' })
  @ApiBody({ type: SubmitLabResultsDto })
  submitResults(
    @Param('id') id: string,
    @Body() dto: SubmitLabResultsDto,
  ) {
    return this.labService.submitResults(id, dto);
  }

  @Post('orders/:id/verify')
  @ApiOperation({ summary: 'Verifikasi & validasi akhir oleh Dokter Penanggung Jawab Lab / Sp.PK' })
  @ApiParam({ name: 'id', description: 'ID Order Lab' })
  @ApiBody({ type: VerifyLabOrderDto })
  verifyOrder(
    @Param('id') id: string,
    @Body() dto: VerifyLabOrderDto,
  ) {
    return this.labService.verifyOrder(id, dto);
  }

  @Get('orders/:id/pdf-data')
  @ApiOperation({ summary: 'Data Lembar Hasil Laboratorium Resmi format A4' })
  @ApiParam({ name: 'id', description: 'ID Order Lab' })
  getPdfData(@Param('id') id: string) {
    return this.labService.getPdfData(id);
  }
}
