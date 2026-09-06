import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @ApiPropertyOptional({ example: 'inv-001', description: 'ID Invoice (Opsional)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: 'a1', description: 'ID Appointment Terkait' })
  @IsString()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ example: 'p1', description: 'ID Pasien' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'Nadia Putri', description: 'Nama Pasien' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ example: 'dr. Maya Pratama, Sp.JP', description: 'Nama Dokter' })
  @IsString()
  @IsNotEmpty()
  doctorName: string;

  @ApiProperty({ example: 'Konsultasi Poli Kardiologi & E-Prescription', description: 'Nama Layanan Medis' })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({ example: 350000, description: 'Total Tagihan (Rp)' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ example: 'Menunggu', description: 'Status Tagihan (Menunggu / Lunas / Refund)' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'QRIS Dinamis', description: 'Metode Pembayaran' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class PayInvoiceDto {
  @ApiPropertyOptional({ example: 'QRIS Dinamis', description: 'Metode Pembayaran (Tunai, QRIS Dinamis, Kartu Debit, Transfer Bank, BPJS Kesehatan)' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 350000, description: 'Nominal Bayar / Uang Diterima Kasir' })
  @IsNumber()
  @IsOptional()
  amountPaid?: number;

  @ApiPropertyOptional({ example: 'Kasir Utama - Siti Rahma', description: 'Nama Kasir / Petugas POS' })
  @IsString()
  @IsOptional()
  cashierName?: string;
}

export class OpenCashierShiftDto {
  @ApiProperty({ example: 'admin-1', description: 'ID Kasir' })
  @IsString()
  @IsNotEmpty()
  cashierId: string;

  @ApiProperty({ example: 'Siti Rahmawati', description: 'Nama Kasir' })
  @IsString()
  @IsNotEmpty()
  cashierName: string;

  @ApiPropertyOptional({ example: 'Pagi', description: 'Nama Shift (Pagi, Siang, Malam)' })
  @IsString()
  @IsOptional()
  shiftName?: string;

  @ApiPropertyOptional({ example: 200000, description: 'Kas Awal / Uang Modal Kembalian' })
  @IsNumber()
  @IsOptional()
  initialCash?: number;

  @ApiPropertyOptional({ description: 'Catatan pembukaan shift' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CloseCashierShiftDto {
  @ApiProperty({ example: 850000, description: 'Total Uang Tunai Fisik di Laci Kasir' })
  @IsNumber()
  @IsNotEmpty()
  actualCashCounted: number;

  @ApiPropertyOptional({ description: 'Catatan serah terima / penutupan shift' })
  @IsString()
  @IsOptional()
  notes?: string;
}

