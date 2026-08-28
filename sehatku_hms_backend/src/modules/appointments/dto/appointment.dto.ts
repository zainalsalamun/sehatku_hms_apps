import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @ApiPropertyOptional({ example: 'a1', description: 'ID Appointment (Opsional)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'd1', description: 'ID Dokter' })
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ example: 'p1', description: 'ID Pasien' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'Hari ini', description: 'Label tanggal (misal: Hari ini, Besok)' })
  @IsString()
  @IsNotEmpty()
  dateLabel: string;

  @ApiProperty({ example: '09:30 WIB', description: 'Jam praktek' })
  @IsString()
  @IsNotEmpty()
  appointmentTime: string;

  @ApiProperty({ example: 'Kardiologi & Vaskular', description: 'Nama Poli / Departemen' })
  @IsString()
  @IsNotEmpty()
  departmentName: string;

  @ApiPropertyOptional({ example: 'Pemeriksaan EKG & Tekanan Darah', description: 'Keluhan / Alasan kunjungan' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CancelAppointmentDto {
  @ApiProperty({ example: 'Dokter berhalangan hadir', description: 'Alasan wajib pembatalan' })
  @IsString()
  @IsNotEmpty({ message: 'Alasan pembatalan tidak boleh kosong' })
  cancellationReason: string;
}
