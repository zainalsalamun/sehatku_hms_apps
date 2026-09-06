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
  CreateCPPTDto,
  CreateInpatientAdmissionDto,
  CreateRoomBedDto,
  DischargePatientDto,
  TransferBedDto,
  UpdateBedStatusDto,
} from './dto/inpatient.dto';
import { InpatientService } from './inpatient.service';

@ApiTags('Inpatient & Bed Management (Rawat Inap)')
@Controller('inpatient')
export class InpatientController {
  constructor(private readonly inpatientService: InpatientService) {}

  // ===================== ROOMS & BEDS =====================

  @Get('beds')
  @ApiOperation({ summary: 'Daftar denah kamar & status bed rawat inap real-time' })
  @ApiQuery({ name: 'classType', required: false, description: 'Filter kelas kamar (VIP, Kelas 1, Kelas 2, Kelas 3, ICU, Isolasi)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter status bed (available, occupied, cleaning, maintenance)' })
  getRoomsAndBeds(
    @Query('classType') classType?: string,
    @Query('status') status?: string,
  ) {
    return this.inpatientService.getRoomsAndBeds(classType, status);
  }

  @Post('beds')
  @ApiOperation({ summary: 'Tambah konfigurasi kamar dan bed baru' })
  @ApiBody({ type: CreateRoomBedDto })
  @ApiResponse({ status: 201, description: 'Bed berhasil ditambahkan' })
  createBed(@Body() dto: CreateRoomBedDto) {
    return this.inpatientService.createBed(dto);
  }

  @Patch('beds/:id/status')
  @ApiOperation({ summary: 'Update status bed (tersedia, dibersihkan, perbaikan)' })
  @ApiParam({ name: 'id', description: 'ID Bed' })
  @ApiBody({ type: UpdateBedStatusDto })
  updateBedStatus(@Param('id') id: string, @Body() dto: UpdateBedStatusDto) {
    return this.inpatientService.updateBedStatus(id, dto);
  }

  // ===================== INPATIENT ADMISSIONS =====================

  @Get('admissions')
  @ApiOperation({ summary: 'Daftar pasien rawat inap aktif dan riwayat pemulangan (Discharge)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter status (active, discharged, all)' })
  @ApiQuery({ name: 'query', required: false, description: 'Pencarian nama pasien, No RM, DPJP, No Admisi' })
  getAdmissions(
    @Query('status') status?: string,
    @Query('query') query?: string,
  ) {
    return this.inpatientService.getAdmissions(status, query);
  }

  @Get('admissions/:id')
  @ApiOperation({ summary: 'Detail lengkap admisi rawat inap & riwayat CPPT harian' })
  @ApiParam({ name: 'id', description: 'ID Admisi Rawat Inap' })
  getAdmissionDetail(@Param('id') id: string) {
    return this.inpatientService.getAdmissionDetail(id);
  }

  @Post('admissions')
  @ApiOperation({ summary: 'Admisi / Check-in pasien baru ke kamar rawat inap' })
  @ApiBody({ type: CreateInpatientAdmissionDto })
  @ApiResponse({ status: 201, description: 'Pasien berhasil masuk rawat inap' })
  createAdmission(@Body() dto: CreateInpatientAdmissionDto) {
    return this.inpatientService.createAdmission(dto);
  }

  @Post('admissions/:id/transfer-bed')
  @ApiOperation({ summary: 'Pindah kamar / transfer bed pasien rawat inap' })
  @ApiParam({ name: 'id', description: 'ID Admisi Rawat Inap' })
  @ApiBody({ type: TransferBedDto })
  transferBed(@Param('id') id: string, @Body() dto: TransferBedDto) {
    return this.inpatientService.transferBed(id, dto);
  }

  @Post('admissions/:id/discharge')
  @ApiOperation({ summary: 'Pulangkan pasien rawat inap (Check-out) & sinkronisasi billing kamar' })
  @ApiParam({ name: 'id', description: 'ID Admisi Rawat Inap' })
  @ApiBody({ type: DischargePatientDto })
  dischargePatient(
    @Param('id') id: string,
    @Body() dto: DischargePatientDto,
  ) {
    return this.inpatientService.dischargePatient(id, dto);
  }

  // ===================== CPPT (PROGRESS NOTES) =====================

  @Get('admissions/:id/cppt')
  @ApiOperation({ summary: 'Daftar lembar catatan CPPT visit dokter & perawat' })
  @ApiParam({ name: 'id', description: 'ID Admisi Rawat Inap' })
  getCPPT(@Param('id') id: string) {
    return this.inpatientService.getCPPT(id);
  }

  @Post('admissions/:id/cppt')
  @ApiOperation({ summary: 'Tambah catatan CPPT baru (SOAP, TTV & Terapi Cairan Ranap)' })
  @ApiParam({ name: 'id', description: 'ID Admisi Rawat Inap' })
  @ApiBody({ type: CreateCPPTDto })
  @ApiResponse({ status: 201, description: 'Catatan CPPT berhasil ditambahkan' })
  createCPPT(@Param('id') id: string, @Body() dto: CreateCPPTDto) {
    return this.inpatientService.createCPPT(id, dto);
  }
}
