import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiPropertyOptional({ example: 'usr-001', description: 'ID User Target Penerima (Opsional)' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'patient', description: 'Target Role (patient / doctor / admin / all)', default: 'all' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({ example: 'Reservasi Dikonfirmasi', description: 'Judul Notifikasi' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Jadwal konsultasi Anda dengan dr. Maya Pratama, Sp.JP pada pukul 09:30 WIB telah dikonfirmasi.', description: 'Isi Pesan Notifikasi' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: 'appointment', description: 'Kategori / Tipe Notifikasi (appointment, prescription, billing, clinical, system, emergency)', default: 'info' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'a1', description: 'ID Objek Terkait (appointmentId, prescriptionId, invoiceId)' })
  @IsString()
  @IsOptional()
  targetId?: string;
}

export class MarkReadDto {
  @ApiPropertyOptional({ example: true, description: 'Status Terbaca' })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
