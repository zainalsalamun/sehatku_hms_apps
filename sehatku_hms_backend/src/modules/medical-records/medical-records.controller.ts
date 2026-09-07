import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateEncounterDto, MedicalRecordsService } from './medical-records.service';

@ApiTags('Medical Records & Clinical EMR')
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get('icd10')
  @ApiOperation({ summary: 'Katalog Pencarian Kode Diagnosis ICD-10 Resmi' })
  @ApiQuery({ name: 'query', required: false, description: 'Kata kunci pencarian (nama penyakit / kode)' })
  getIcd10Codes(@Query('query') query?: string) {
    return this.medicalRecordsService.getIcd10Codes(query);
  }

  @Get('formulary')
  @ApiOperation({ summary: 'Katalog Obat Formularium Rumah Sakit & Farmasi' })
  @ApiQuery({ name: 'query', required: false, description: 'Kata kunci pencarian nama obat' })
  getFormulary(@Query('query') query?: string) {
    return this.medicalRecordsService.getFormulary(query);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar riwayat rekam medis (Encounter, Diagnosis, E-Prescription)' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter berdasarkan Patient ID' })
  findAll(@Query('patientId') patientId?: string) {
    return this.medicalRecordsService.findAll(patientId);
  }

  @Get('certificates')
  @ApiOperation({ summary: 'Daftar Surat Keterangan Medis (SKD & Surat Sehat)' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  findAllCertificates(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.medicalRecordsService.findAllCertificates(patientId, doctorId);
  }

  @Get('certificates/:id')
  @ApiOperation({ summary: 'Detail Surat Keterangan Medis' })
  findCertificateById(@Param('id') id: string) {
    return this.medicalRecordsService.findCertificateById(id);
  }

  @Post('certificates')
  @ApiOperation({ summary: 'Terbitkan Surat Keterangan Sakit (SKD) atau Surat Sehat' })
  createCertificate(@Body() dto: any) {
    return this.medicalRecordsService.createCertificate(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail rekam medis berdasarkan ID Encounter' })
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat Rekam Medis (Encounter SOAP), Diagnosis ICD-10 & E-Prescription' })
  @ApiResponse({ status: 201, description: 'Encounter klinis berhasil disimpan ke database.' })
  create(@Body() dto: CreateEncounterDto) {
    return this.medicalRecordsService.create(dto);
  }
}
