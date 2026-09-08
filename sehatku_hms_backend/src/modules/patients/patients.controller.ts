import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar seluruh data pasien dengan filter' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'insurance', required: false })
  findAll(
    @Query('query') query?: string,
    @Query('insurance') insurance?: string,
  ) {
    return this.patientsService.findAll(query, insurance);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail rekam medis pasien berdasarkan ID' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrasi pasien baru ke sistem rekam medis (Staf/Admin)' })
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui data demografis & asuransi pasien' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengubah status aktif/nonaktif pasien' })
  toggleStatus(@Param('id') id: string) {
    return this.patientsService.toggleStatus(id);
  }
}
