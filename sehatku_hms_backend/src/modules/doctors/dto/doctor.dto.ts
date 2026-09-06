import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ example: 'dr. Bima Santoso, Sp.N', description: 'Nama dokter dan gelar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'SIP.449.1/055/2018', description: 'Nomor SIP / STR resmi' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({ example: 'dept-1', description: 'ID Departemen / Poliklinik' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ example: 'Neurologi', description: 'Spesialisasi klinis' })
  @IsString()
  @IsNotEmpty()
  specialist: string;

  @ApiPropertyOptional({ example: 15, description: 'Pengalaman dalam tahun' })
  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @ApiPropertyOptional({ example: '0815-6677-8899', description: 'Nomor telepon dokter' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'bima@sehatku-hospital.id', description: 'Email dokter' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: ['Senin', 'Rabu', 'Jumat'], description: 'Hari praktek rutin' })
  @IsArray()
  @IsOptional()
  scheduleDays?: string[];
}

export class UpdateDoctorDto extends CreateDoctorDto {
  @ApiPropertyOptional({ example: 'active', description: 'Status: active / inactive' })
  @IsString()
  @IsOptional()
  status?: string;
}
