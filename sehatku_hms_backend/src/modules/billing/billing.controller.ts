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
import { BillingService } from './billing.service';
import {
  CloseCashierShiftDto,
  CreateInvoiceDto,
  OpenCashierShiftDto,
  PayInvoiceDto,
} from './dto/billing.dto';

@ApiTags('Billing, Cashier POS & Official Invoices')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ===================== CASHIER SHIFT ROUTES =====================

  @Post('shifts/open')
  @ApiOperation({ summary: 'Buka shift kasir baru dengan modal kas awal' })
  @ApiBody({ type: OpenCashierShiftDto })
  openShift(@Body() dto: OpenCashierShiftDto) {
    return this.billingService.openShift(dto);
  }

  @Get('shifts/current')
  @ApiOperation({ summary: 'Cek status shift kasir yang sedang aktif dan ringkasan transaksi live' })
  @ApiQuery({ name: 'cashierId', required: false, description: 'ID Kasir' })
  getCurrentShift(@Query('cashierId') cashierId?: string) {
    return this.billingService.getCurrentShift(cashierId);
  }

  @Get('shifts')
  @ApiOperation({ summary: 'Riwayat seluruh shift kasir & rekap tutup kas' })
  findAllShifts() {
    return this.billingService.findAllShifts();
  }

  @Post('shifts/:id/close')
  @ApiOperation({ summary: 'Tutup shift kasir, hitung uang fisik laci, dan cetak rekap serah terima' })
  @ApiParam({ name: 'id', description: 'ID Shift Kasir' })
  @ApiBody({ type: CloseCashierShiftDto })
  closeShift(@Param('id') id: string, @Body() dto: CloseCashierShiftDto) {
    return this.billingService.closeShift(id, dto);
  }

  // ===================== INVOICE ROUTES =====================

  @Get('invoices')
  @ApiOperation({ summary: 'Daftar seluruh invoice tagihan dan status pelunasan kasir' })
  @ApiQuery({ name: 'query', required: false, description: 'Kata kunci pencarian (No Invoice, Nama Pasien, Dokter, Layanan)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter status pembayaran (Lunas, Menunggu, Refund)' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter invoice khusus pasien tertentu' })
  findAll(
    @Query('query') query?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.billingService.findAll(query, status, patientId);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Detail invoice tagihan dengan rincian item tindakan & obat' })
  @ApiParam({ name: 'id', description: 'ID Invoice atau Nomor Invoice' })
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Get('invoices/:id/receipt-data')
  @ApiOperation({ summary: 'Data format kwitansi / invoice resmi RS siap cetak PDF' })
  @ApiParam({ name: 'id', description: 'ID Invoice atau Nomor Invoice' })
  getReceiptData(@Param('id') id: string) {
    return this.billingService.getReceiptData(id);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Buat tagihan invoice baru dari kasir / tindakan medis' })
  @ApiResponse({ status: 201, description: 'Invoice tagihan berhasil dibuat' })
  create(@Body() dto: CreateInvoiceDto) {
    return this.billingService.create(dto);
  }

  @Patch('invoices/:id/pay')
  @ApiOperation({ summary: 'Proses pelunasan tagihan kasir POS (Multi-metode bayar & Kwitansi)' })
  @ApiParam({ name: 'id', description: 'ID Invoice yang akan dilunasi' })
  @ApiBody({ type: PayInvoiceDto })
  payInvoice(@Param('id') id: string, @Body() dto: PayInvoiceDto) {
    return this.billingService.payInvoice(id, dto);
  }
}

