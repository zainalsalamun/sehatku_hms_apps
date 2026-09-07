import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLabTestCatalogDto {
  @ApiProperty({ example: 'LAB-DL', description: 'Kode Tes Lab' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Darah Lengkap (Hematologi 5-Diff)', description: 'Nama Tes / Panel Lab' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Hematologi',
    description: 'Kategori Tes (Hematologi, Kimia Klinik, Urinalisis, Imunologi & Serologi, Radiologi, Mikrobiologi)',
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'Darah Vena (EDTA)', description: 'Jenis Sampel' })
  @IsOptional()
  @IsString()
  sampleType?: string;

  @ApiPropertyOptional({ example: 'g/dL', description: 'Satuan Hasil' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 12.0, description: 'Batas Nilai Rujukan Bawah' })
  @IsOptional()
  @IsNumber()
  normalRangeMin?: number;

  @ApiPropertyOptional({ example: 16.5, description: 'Batas Nilai Rujukan Atas' })
  @IsOptional()
  @IsNumber()
  normalRangeMax?: number;

  @ApiPropertyOptional({ example: '12.0 - 16.5 g/dL', description: 'Teks Nilai Rujukan Lengkap' })
  @IsOptional()
  @IsString()
  normalRangeText?: string;

  @ApiProperty({ example: 120000, description: 'Tarif Pemeriksaan Lab' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 'Pemeriksaan Hb, Leukosit, Trombosit, Hematokrit, Eritrosit', description: 'Deskripsi' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class LabOrderItemInputDto {
  @ApiProperty({ example: 'test-catalog-uuid', description: 'ID Katalog Tes (opsional jika manual)' })
  @IsOptional()
  @IsString()
  testCatalogId?: string;

  @ApiProperty({ example: 'LAB-HB', description: 'Kode Tes' })
  @IsString()
  testCode: string;

  @ApiProperty({ example: 'Hemoglobin (Hb)', description: 'Nama Parameter Tes' })
  @IsString()
  testName: string;

  @ApiProperty({ example: 'Hematologi', description: 'Kategori' })
  @IsString()
  category: string;

  @ApiProperty({ example: 45000, description: 'Tarif Pemeriksaan' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 'g/dL' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '13.0 - 17.5 g/dL' })
  @IsOptional()
  @IsString()
  normalRangeText?: string;
}

export class CreateLabOrderDto {
  @ApiProperty({ example: 'patient-uuid', description: 'ID Pasien' })
  @IsString()
  patientId: string;

  @ApiProperty({ example: 'doctor-uuid', description: 'ID Dokter Perujuk / Pengorder' })
  @IsString()
  doctorId: string;

  @ApiPropertyOptional({ example: 'appointment-uuid', description: 'ID Janji Temu Poli (jika rawat jalan)' })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({ example: 'admission-uuid', description: 'ID Admisi Ranap (jika rawat inap)' })
  @IsOptional()
  @IsString()
  admissionId?: string;

  @ApiPropertyOptional({ example: 'Normal', enum: ['Normal', 'CITO / Cepat'], description: 'Prioritas Order' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'DHF Grade II / Demam Dengue', description: 'Diagnosa Klinis Pengantar' })
  @IsOptional()
  @IsString()
  clinicalDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Cek darah serial per 12 jam, pantau penurunan trombosit', description: 'Catatan Klinis Dokter' })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @ApiProperty({ type: [LabOrderItemInputDto], description: 'Daftar item tes lab yang diperiksa' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabOrderItemInputDto)
  items: LabOrderItemInputDto[];
}

export class CollectLabSampleDto {
  @ApiProperty({ example: 'Ns. Siti Rahma, S.Kep', description: 'Nama Petugas Pengambil Sampel' })
  @IsString()
  collectorName: string;
}

export class LabItemResultInputDto {
  @ApiProperty({ example: 'item-uuid', description: 'ID LabOrderItem' })
  @IsString()
  itemId: string;

  @ApiProperty({ example: '10.2', description: 'Nilai Hasil Pengujian' })
  @IsString()
  resultValue: string;

  @ApiPropertyOptional({ example: 'low', enum: ['normal', 'low', 'high', 'critical'], description: 'Flagging Nilai Klinis' })
  @IsOptional()
  @IsString()
  flag?: string;

  @ApiPropertyOptional({ example: 'Dikonfirmasi ulang dengan alat Sysmex XN-550', description: 'Catatan Analis' })
  @IsOptional()
  @IsString()
  analystNotes?: string;

  @ApiProperty({ example: 'Analis Wahyu Hidayat, A.Md.AK', description: 'Nama Analis Pemeriksa' })
  @IsString()
  analyzedBy: string;
}

export class SubmitLabResultsDto {
  @ApiProperty({ type: [LabItemResultInputDto], description: 'Daftar hasil pengujian item' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabItemResultInputDto)
  results: LabItemResultInputDto[];
}

export class VerifyLabOrderDto {
  @ApiProperty({ example: 'dr. Hendra Gunawan, Sp.PK', description: 'Nama Dokter Penanggung Jawab Lab / Verifikator' })
  @IsString()
  verifiedBy: string;
}
