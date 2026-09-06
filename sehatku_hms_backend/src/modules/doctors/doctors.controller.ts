import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar seluruh dokter dengan filter' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  findAll(
    @Query('query') query?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.doctorsService.findAll(query, departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail dokter berdasarkan ID' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Menambahkan dokter baru ke sistem (Admin)' })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui informasi dokter (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mengubah status aktif/nonaktif dokter' })
  toggleActive(@Param('id') id: string) {
    return this.doctorsService.toggleActive(id);
  }
}
