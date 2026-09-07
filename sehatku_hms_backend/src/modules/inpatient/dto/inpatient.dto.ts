import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRoomBedDto {
  @ApiPropertyOptional({ example: '10000000-0000-4000-8000-000000000001' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiProperty({ example: 'R-201' })
  @IsNotEmpty()
  @IsString()
  roomNumber: string;

  @ApiProperty({ example: 'Paviliun Melati 1' })
  @IsNotEmpty()
  @IsString()
  roomName: string;

  @ApiProperty({ example: 'Bed A' })
  @IsNotEmpty()
  @IsString()
  bedNumber: string;

  @ApiProperty({ example: 'Kelas 1', enum: ['VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'ICU', 'Isolasi'] })
  @IsNotEmpty()
  @IsString()
  classType: string;

  @ApiProperty({ example: 450000 })
  @IsNotEmpty()
  @IsNumber()
  dailyRate: number;

  @ApiPropertyOptional({ example: 'available', enum: ['available', 'occupied', 'cleaning', 'maintenance'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Dekat jendela, fasilitas AC & TV' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBedStatusDto {
  @ApiProperty({ example: 'available', enum: ['available', 'occupied', 'cleaning', 'maintenance'] })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Kamar telah dibersihkan dan disterilisasi' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInpatientAdmissionDto {
  @ApiPropertyOptional({ example: '10000000-0000-4000-8000-000000000001' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiProperty({ example: '40000000-0000-4000-8000-000000000001' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiProperty({ example: '30000000-0000-4000-8000-000000000001' })
  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @ApiProperty({ example: 'bed-uuid-or-id' })
  @IsNotEmpty()
  @IsString()
  bedId: string;

  @ApiPropertyOptional({ example: 'Poliklinik', enum: ['Poliklinik', 'IGD', 'Rujukan Luar'] })
  @IsOptional()
  @IsString()
  admissionType?: string;

  @ApiPropertyOptional({ example: 'Demam Berdarah Dengue (DHF Grade II)' })
  @IsOptional()
  @IsString()
  initialDiagnosis?: string;

  @ApiPropertyOptional({ example: 'Pasien lemas, trombosit 85.000, perlu rehidrasi RL 20 tpm' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TransferBedDto {
  @ApiProperty({ example: 'new-bed-uuid' })
  @IsNotEmpty()
  @IsString()
  newBedId: string;

  @ApiPropertyOptional({ example: 'Pasien meminta upgrade ke kamar VIP' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DischargePatientDto {
  @ApiProperty({ example: 'Dengue Hemorrhagic Fever - Membaik' })
  @IsNotEmpty()
  @IsString()
  dischargeDiagnosis: string;

  @ApiProperty({ example: 'Sembuh', enum: ['Sembuh', 'Perbaikan', 'Rujuk RS Lain', 'Pulang Paksa', 'Meninggal'] })
  @IsNotEmpty()
  @IsString()
  dischargeCondition: string;

  @ApiPropertyOptional({ example: 'Pasien diijinkan pulang. Kontrol poli penyakit dalam 3 hari lagi.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCPPTDto {
  @ApiProperty({ example: 'Dokter DPJP', enum: ['Dokter DPJP', 'Dokter Jaga', 'Perawat Ranap', 'Bidan', 'Ahli Gizi', 'Farmasi Klinis'] })
  @IsNotEmpty()
  @IsString()
  recorderRole: string;

  @ApiProperty({ example: 'dr. Maya Pratama, Sp.JP' })
  @IsNotEmpty()
  @IsString()
  recorderName: string;

  @ApiPropertyOptional({ example: 'Pasien mengeluh mual berkurang, nafsu makan mulai membaik, demam sudah turun.' })
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiPropertyOptional({ example: 'Sens: CM. TD: 118/76 mmHg, HR: 80x/m, RR: 18x/m, T: 36.6 C, SpO2: 99% RA. Akral hangat.' })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({ example: 'DHF Grade II fase pemulihan. Trombosit meningkat 120.000.' })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({ example: 'Terapi cairan infus Asering 1500cc/24jam. Paracetamol PO 500mg prn demam. Diet makanan lunak TKTP.' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ example: 'Monitor balance cairan tiap 8 jam & cek darah lengkap besok pagi pk 06:00.' })
  @IsOptional()
  @IsString()
  instruction?: string;

  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional({ example: 36.8 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  respiratoryRate?: number;

  @ApiPropertyOptional({ example: 98 })
  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;
}
