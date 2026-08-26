import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto, CreateAppointmentDto } from './dto/appointment.dto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar seluruh janji temu dan antrean (bisa difilter per pasien)' })
  @ApiQuery({ name: 'query', required: false, description: 'Pencarian bebas nama dokter, pasien, atau nomor antrean' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter status (Checked-in, Menunggu, Terkonfirmasi, Selesai, Dibatalkan)' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter histori reservasi spesifik pasien (ID / Nama / MRN)' })
  findAll(
    @Query('query') query?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.appointmentsService.findAll(query, status, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail appointment berdasarkan ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Membuat janji temu baru' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Patch(':id/check-in')
  @ApiOperation({ summary: 'Melakukan check-in manual kedatangan pasien' })
  checkIn(@Param('id') id: string) {
    return this.appointmentsService.checkIn(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Menandai selesai konsultasi' })
  complete(@Param('id') id: string) {
    return this.appointmentsService.complete(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Membatalkan janji temu dengan menyertakan alasan' })
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancel(id, dto);
  }
}
