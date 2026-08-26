import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CancelAppointmentDto, CreateAppointmentDto } from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: string, status?: string, patientId?: string) {
    return this.prisma.appointment.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(patientId
          ? {
              OR: [
                { patientId },
                { patient: { name: { contains: patientId, mode: 'insensitive' } } },
                { patient: { medicalRecordNumber: { contains: patientId, mode: 'insensitive' } } },
              ],
            }
          : {}),
        ...(query
          ? {
              OR: [
                { queueNumber: { contains: query, mode: 'insensitive' } },
                { patient: { name: { contains: query, mode: 'insensitive' } } },
                { doctor: { name: { contains: query, mode: 'insensitive' } } },
                { departmentName: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        doctor: true,
        patient: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: {
        OR: [{ id }, { queueNumber: id }],
      },
      include: { doctor: true, patient: true, queueTicket: true },
    });
    if (!appt) throw new NotFoundException('Appointment tidak ditemukan');
    return appt;
  }

  async create(dto: CreateAppointmentDto, hospitalId = '00000001-0000-4000-8000-000000000001') {
    let targetHospitalId = hospitalId;
    if (targetHospitalId === 'hosp-001' || !targetHospitalId) {
      const hosp = await this.prisma.hospital.findFirst();
      targetHospitalId = hosp?.id || '00000001-0000-4000-8000-000000000001';
    }

    // Generate sequential queue number
    const count = await this.prisma.appointment.count();
    const queueNumber = `A-${(count + 1).toString().padStart(3, '0')}`;

    const created = await this.prisma.appointment.create({
      data: {
        id: dto.id || undefined,
        hospitalId: targetHospitalId,
        doctorId: dto.doctorId,
        patientId: dto.patientId,
        dateLabel: dto.dateLabel,
        appointmentTime: dto.appointmentTime,
        departmentName: dto.departmentName,
        reason: dto.reason || 'Konsultasi Poli',
        queueNumber,
        status: 'Menunggu',
      },
      include: { doctor: true, patient: true },
    });

    // Auto-trigger notifications
    try {
      await this.prisma.notification.createMany({
        data: [
          {
            role: 'patient',
            title: 'Reservasi Dokter Berhasil',
            message: `Reservasi Anda di Poli ${created.departmentName} dengan ${created.doctor?.name || 'Dokter Spesialis'} (${created.dateLabel}, ${created.appointmentTime}) telah terdaftar dengan Nomor Antrean ${created.queueNumber}.`,
            type: 'appointment',
            targetId: created.id,
            isRead: false,
          },
          {
            role: 'doctor',
            title: 'Pasien Reservasi Baru Masuk',
            message: `Pasien ${created.patient?.name || 'Pasien'} telah memesan sesi konsultasi di Poli ${created.departmentName} (${created.dateLabel}, ${created.appointmentTime}).`,
            type: 'appointment',
            targetId: created.id,
            isRead: false,
          },
          {
            role: 'admin',
            title: 'Reservasi Baru Terdaftar',
            message: `Tiket antrean ${created.queueNumber} terbit untuk ${created.patient?.name || 'Pasien'} (${created.doctor?.name || 'Dokter'}).`,
            type: 'appointment',
            targetId: created.id,
            isRead: false,
          },
        ],
      });
    } catch (e) {
      // Non-blocking notification failure
    }

    return created;
  }

  async checkIn(id: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: {
        OR: [{ id }, { queueNumber: id }],
      },
    });

    if (!appt) {
      throw new NotFoundException('Reservasi tidak ditemukan.');
    }

    if (appt.status === 'Selesai') {
      throw new BadRequestException('Pemeriksaan telah selesai. Tidak dapat melakukan check-in.');
    }
    if (appt.status === 'Dibatalkan') {
      throw new BadRequestException('Reservasi telah dibatalkan. Tidak dapat melakukan check-in.');
    }
    if (appt.status === 'Checked-in') {
      throw new BadRequestException('Pasien sudah melakukan check-in sebelumnya.');
    }
    if (
      appt.status === 'Kadaluarsa' ||
      appt.dateLabel?.toLowerCase().includes('kemarin')
    ) {
      throw new BadRequestException('Jadwal reservasi telah terlewat / kadaluarsa.');
    }

    // Update queue ticket status as well
    try {
      await this.prisma.queueTicket.updateMany({
        where: { appointmentId: appt.id },
        data: { status: 'called' },
      });
    } catch (e) {}

    return this.prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'Checked-in' },
      include: { doctor: true, patient: true },
    });
  }

  async complete(id: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: {
        OR: [{ id }, { queueNumber: id }],
      },
    });

    if (!appt) {
      return { id, status: 'Selesai' };
    }

    return this.prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'Selesai' },
      include: { doctor: true, patient: true },
    });
  }

  async cancel(id: string, dto: CancelAppointmentDto) {
    const appt = await this.prisma.appointment.findFirst({
      where: {
        OR: [{ id }, { queueNumber: id }],
      },
      include: { doctor: true, patient: true },
    });

    if (!appt) {
      return { id, status: 'Dibatalkan', cancellationReason: dto.cancellationReason };
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appt.id },
      data: {
        status: 'Dibatalkan',
        cancellationReason: dto.cancellationReason,
      },
      include: { doctor: true, patient: true },
    });

    // Auto-trigger notifications
    try {
      await this.prisma.notification.createMany({
        data: [
          {
            role: 'patient',
            title: 'Reservasi Telah Dibatalkan',
            message: `Reservasi konsultasi ${appt.queueNumber} dengan ${appt.doctor?.name || 'Dokter'} telah dibatalkan. Alasan: ${dto.cancellationReason || 'Permintaan pembatalan'}.`,
            type: 'appointment',
            targetId: appt.id,
            isRead: false,
          },
          {
            role: 'doctor',
            title: 'Pasien Membatalkan Reservasi',
            message: `Antrean ${appt.queueNumber} atas nama ${appt.patient?.name || 'Pasien'} telah dibatalkan.`,
            type: 'appointment',
            targetId: appt.id,
            isRead: false,
          },
        ],
      });
    } catch (e) {}

    return updated;
  }
}
