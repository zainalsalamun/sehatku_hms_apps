import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ example: 'MRN-2026-005', description: 'Nomor Rekam Medis (MRN)' })
  @IsString()
  @IsNotEmpty()
  medicalRecordNumber: string;

  @ApiProperty({ example: 'Ahmad Fauzi', description: 'Nama lengkap pasien' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '3201123456780005', description: 'Nomor Induk Kependudukan (NIK)' })
  @IsString()
  @IsOptional()
  nik?: string;

  @ApiProperty({ example: '1990-05-20', description: 'Tanggal lahir (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty({ example: 'Laki-laki', description: 'Jenis kelamin: Laki-laki / Perempuan' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiPropertyOptional({ example: 'O+', description: 'Golongan darah' })
  @IsString()
  @IsOptional()
  bloodType?: string;

  @ApiPropertyOptional({ example: 'BPJS Kesehatan Mandiri', description: 'Penjamin asuransi' })
  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @ApiPropertyOptional({ example: '0812-3344-5566', description: 'Nomor telepon' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'ahmad.fauzi@gmail.com', description: 'Alamat email' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 10, Jakarta Selatan', description: 'Alamat domisili' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Siti (Istri) - 0812-3344-5500', description: 'Kontak darurat' })
  @IsString()
  @IsOptional()
  emergencyContact?: string;
}

export class UpdatePatientDto extends CreatePatientDto {
  @ApiPropertyOptional({ example: 'Aktif', description: 'Status pasien: Aktif / Nonaktif' })
  @IsString()
  @IsOptional()
  status?: string;
}
