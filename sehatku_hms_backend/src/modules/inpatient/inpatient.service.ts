import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCPPTDto,
  CreateInpatientAdmissionDto,
  CreateRoomBedDto,
  DischargePatientDto,
  TransferBedDto,
  UpdateBedStatusDto,
} from './dto/inpatient.dto';

@Injectable()
export class InpatientService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly DEFAULT_HOSPITAL_ID =
    '00000001-0000-4000-8000-000000000001';

  private async getValidHospitalId(providedId?: string): Promise<string> {
    if (providedId && providedId !== 'hosp-001' && providedId !== '10000000-0000-4000-8000-000000000001') {
      const exists = await this.prisma.hospital.findUnique({ where: { id: providedId } });
      if (exists) return exists.id;
    }
    const hosp = await this.prisma.hospital.findFirst();
    return hosp?.id || this.DEFAULT_HOSPITAL_ID;
  }

  // ===================== ROOMS & BEDS =====================

  async getRoomsAndBeds(classType?: string, status?: string) {
    await this.seedDefaultBedsIfEmpty();

    const where: any = {};
    if (classType && classType !== 'all') {
      where.classType = classType;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const beds = await this.prisma.roomBed.findMany({
      where,
      orderBy: [{ classType: 'asc' }, { roomNumber: 'asc' }, { bedNumber: 'asc' }],
      include: {
        admissions: {
          where: { status: 'active' },
          include: {
            patient: true,
            doctor: true,
          },
          take: 1,
        },
      },
    });

    return beds.map((b) => {
      const activeAdmission = b.admissions[0];
      let patientInfo: any = null;

      if (activeAdmission) {
        const admissionDate = new Date(activeAdmission.admissionDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
        const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        patientInfo = {
          admissionId: activeAdmission.id,
          admissionNumber: activeAdmission.admissionNumber,
          patientId: activeAdmission.patientId,
          patientName: activeAdmission.patient.name,
          patientMrn: activeAdmission.patient.medicalRecordNumber,
          patientGender: activeAdmission.patient.gender,
          insurance: activeAdmission.patient.insuranceProvider || 'Umum',
          doctorId: activeAdmission.doctorId,
          doctorName: activeAdmission.doctor.name,
          admissionDate: activeAdmission.admissionDate,
          daysAdmitted: days,
          initialDiagnosis: activeAdmission.initialDiagnosis,
        };
      }

      return {
        id: b.id,
        roomNumber: b.roomNumber,
        roomName: b.roomName,
        bedNumber: b.bedNumber,
        classType: b.classType,
        dailyRate: Number(b.dailyRate),
        status: b.status,
        notes: b.notes,
        activePatient: patientInfo,
      };
    });
  }

  async createBed(dto: CreateRoomBedDto) {
    const hospitalId = await this.getValidHospitalId(dto.hospitalId);

    return this.prisma.roomBed.create({
      data: {
        hospitalId,
        roomNumber: dto.roomNumber,
        roomName: dto.roomName,
        bedNumber: dto.bedNumber,
        classType: dto.classType,
        dailyRate: dto.dailyRate,
        status: dto.status || 'available',
        notes: dto.notes,
      },
    });
  }

  async updateBedStatus(id: string, dto: UpdateBedStatusDto) {
    const bed = await this.prisma.roomBed.findUnique({ where: { id } });
    if (!bed) throw new NotFoundException('Kamar / Bed tidak ditemukan');

    return this.prisma.roomBed.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes !== undefined ? dto.notes : bed.notes,
      },
    });
  }

  // ===================== INPATIENT ADMISSIONS =====================

  async getAdmissions(status?: string, query?: string) {
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { admissionNumber: { contains: query, mode: 'insensitive' } },
        { patient: { name: { contains: query, mode: 'insensitive' } } },
        { patient: { medicalRecordNumber: { contains: query, mode: 'insensitive' } } },
        { doctor: { name: { contains: query, mode: 'insensitive' } } },
        { initialDiagnosis: { contains: query, mode: 'insensitive' } },
      ];
    }

    const admissions = await this.prisma.inpatientAdmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        doctor: true,
        bed: true,
        cpptRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    return admissions.map((a) => {
      const admissionDate = new Date(a.admissionDate);
      const endDate = a.dischargeDate ? new Date(a.dischargeDate) : new Date();
      const diffTime = Math.abs(endDate.getTime() - admissionDate.getTime());
      const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const estimatedCost = days * Number(a.bed.dailyRate);

      return {
        id: a.id,
        admissionNumber: a.admissionNumber,
        patientId: a.patientId,
        patientName: a.patient.name,
        patientMrn: a.patient.medicalRecordNumber,
        patientPhone: a.patient.phone || '-',
        patientGender: a.patient.gender,
        patientInsurance: a.patient.insuranceProvider || 'Umum',
        doctorId: a.doctorId,
        doctorName: a.doctor.name,
        doctorSpecialist: a.doctor.specialist,
        bedId: a.bedId,
        roomNumber: a.bed.roomNumber,
        roomName: a.bed.roomName,
        bedNumber: a.bed.bedNumber,
        classType: a.bed.classType,
        dailyRate: Number(a.bed.dailyRate),
        admissionDate: a.admissionDate,
        dischargeDate: a.dischargeDate,
        admissionType: a.admissionType,
        initialDiagnosis: a.initialDiagnosis,
        dischargeDiagnosis: a.dischargeDiagnosis,
        dischargeCondition: a.dischargeCondition,
        status: a.status,
        totalDays: a.status === 'active' ? days : a.totalDays,
        totalBedCost:
          a.status === 'active' ? estimatedCost : Number(a.totalBedCost),
        latestCPPT: a.cpptRecords[0] || null,
      };
    });
  }

  async getAdmissionDetail(id: string) {
    const admission = await this.prisma.inpatientAdmission.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        bed: true,
        cpptRecords: {
          orderBy: { recordedAt: 'desc' },
        },
      },
    });

    if (!admission) throw new NotFoundException('Data rawat inap tidak ditemukan');

    const admissionDate = new Date(admission.admissionDate);
    const endDate = admission.dischargeDate
      ? new Date(admission.dischargeDate)
      : new Date();
    const diffTime = Math.abs(endDate.getTime() - admissionDate.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      id: admission.id,
      admissionNumber: admission.admissionNumber,
      patientId: admission.patientId,
      patientName: admission.patient.name,
      patientMrn: admission.patient.medicalRecordNumber,
      patientPhone: admission.patient.phone || '-',
      patientGender: admission.patient.gender,
      patientBirthDate: admission.patient.birthDate,
      patientAddress: admission.patient.address || '-',
      patientInsurance: admission.patient.insuranceProvider || 'Umum',
      doctorId: admission.doctorId,
      doctorName: admission.doctor.name,
      doctorSpecialist: admission.doctor.specialist,
      bedId: admission.bedId,
      roomNumber: admission.bed.roomNumber,
      roomName: admission.bed.roomName,
      bedNumber: admission.bed.bedNumber,
      classType: admission.bed.classType,
      dailyRate: Number(admission.bed.dailyRate),
      admissionDate: admission.admissionDate,
      dischargeDate: admission.dischargeDate,
      admissionType: admission.admissionType,
      initialDiagnosis: admission.initialDiagnosis,
      dischargeDiagnosis: admission.dischargeDiagnosis,
      dischargeCondition: admission.dischargeCondition,
      status: admission.status,
      totalDays: admission.status === 'active' ? days : admission.totalDays,
      totalBedCost:
        admission.status === 'active'
          ? days * Number(admission.bed.dailyRate)
          : Number(admission.totalBedCost),
      notes: admission.notes,
      cpptRecords: admission.cpptRecords.map((c) => ({
        id: c.id,
        recorderRole: c.recorderRole,
        recorderName: c.recorderName,
        recordedAt: c.recordedAt,
        subjective: c.subjective,
        objective: c.objective,
        assessment: c.assessment,
        plan: c.plan,
        instruction: c.instruction,
        bloodPressure: c.bloodPressure,
        heartRate: c.heartRate,
        temperature: c.temperature ? Number(c.temperature) : null,
        respiratoryRate: c.respiratoryRate,
        oxygenSaturation: c.oxygenSaturation,
      })),
    };
  }

  async createAdmission(dto: CreateInpatientAdmissionDto) {
    const hospitalId = await this.getValidHospitalId(dto.hospitalId);

    // Check bed availability
    const bed = await this.prisma.roomBed.findUnique({
      where: { id: dto.bedId },
    });
    if (!bed) throw new NotFoundException('Kamar / Bed tidak ditemukan');
    if (bed.status === 'occupied') {
      throw new BadRequestException(
        `Bed ${bed.bedNumber} di ${bed.roomName} saat ini sedang terisi pasien lain.`,
      );
    }

    // Generate admission number
    const count = await this.prisma.inpatientAdmission.count();
    const year = new Date().getFullYear();
    const admissionNumber = `RANAP-${year}-${(count + 1).toString().padStart(3, '0')}`;

    // Create admission
    const admission = await this.prisma.inpatientAdmission.create({
      data: {
        hospitalId,
        admissionNumber,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        bedId: dto.bedId,
        admissionDate: new Date(),
        admissionType: dto.admissionType || 'Poliklinik',
        initialDiagnosis: dto.initialDiagnosis,
        status: 'active',
        notes: dto.notes,
      },
      include: {
        patient: true,
        doctor: true,
        bed: true,
      },
    });

    // Update bed status to occupied
    await this.prisma.roomBed.update({
      where: { id: dto.bedId },
      data: { status: 'occupied' },
    });

    // Create initial CPPT entry
    await this.prisma.inpatientCPPT.create({
      data: {
        admissionId: admission.id,
        recorderRole: 'Dokter DPJP',
        recorderName: admission.doctor.name,
        subjective: `Pasien masuk rawat inap via ${dto.admissionType || 'Poliklinik'}. Keluhan: ${dto.initialDiagnosis || 'Observasi klinis lanjutan.'}`,
        objective: 'Keadaan Umum: Sedang. Kesadaran: Compos Mentis.',
        assessment: dto.initialDiagnosis || 'Observasi Rawat Inap',
        plan: 'Monitoring tanda vital per 4 jam, pasang infus IVFD, diet sesuai indikasi dokter DPJP.',
        instruction: 'Lapor DPJP jika ada tanda perburukan atau suhu > 38.5 C.',
      },
    });

    return admission;
  }

  async transferBed(admissionId: string, dto: TransferBedDto) {
    const admission = await this.prisma.inpatientAdmission.findUnique({
      where: { id: admissionId },
      include: { bed: true },
    });
    if (!admission) throw new NotFoundException('Admisi rawat inap tidak ditemukan');
    if (admission.status !== 'active') {
      throw new BadRequestException('Pasien tidak dalam status rawat inap aktif.');
    }

    const newBed = await this.prisma.roomBed.findUnique({
      where: { id: dto.newBedId },
    });
    if (!newBed) throw new NotFoundException('Bed tujuan tidak ditemukan');
    if (newBed.status === 'occupied') {
      throw new BadRequestException('Bed tujuan sedang terisi pasien.');
    }

    const oldBedId = admission.bedId;

    // Update admission bed
    const updated = await this.prisma.inpatientAdmission.update({
      where: { id: admissionId },
      data: {
        bedId: dto.newBedId,
        notes: admission.notes
          ? `${admission.notes}\n[Pindah Bed]: Dari ${admission.bed.roomName} (${admission.bed.bedNumber}) ke ${newBed.roomName} (${newBed.bedNumber}). Alasan: ${dto.reason || 'Permintaan pasien'}`
          : `[Pindah Bed]: Dari ${admission.bed.roomName} ke ${newBed.roomName}. Alasan: ${dto.reason || 'Permintaan pasien'}`,
      },
      include: { bed: true, patient: true },
    });

    // Set old bed to cleaning
    await this.prisma.roomBed.update({
      where: { id: oldBedId },
      data: { status: 'cleaning' },
    });

    // Set new bed to occupied
    await this.prisma.roomBed.update({
      where: { id: dto.newBedId },
      data: { status: 'occupied' },
    });

    return updated;
  }

  async dischargePatient(admissionId: string, dto: DischargePatientDto) {
    const admission = await this.prisma.inpatientAdmission.findUnique({
      where: { id: admissionId },
      include: { bed: true, patient: true, doctor: true },
    });
    if (!admission) throw new NotFoundException('Admisi rawat inap tidak ditemukan');
    if (admission.status !== 'active') {
      throw new BadRequestException('Pasien sudah pernah dipulangkan.');
    }

    const dischargeDate = new Date();
    const admissionDate = new Date(admission.admissionDate);
    const diffTime = Math.abs(dischargeDate.getTime() - admissionDate.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalBedCost = totalDays * Number(admission.bed.dailyRate);

    // Update admission
    const discharged = await this.prisma.inpatientAdmission.update({
      where: { id: admissionId },
      data: {
        status: 'discharged',
        dischargeDate,
        totalDays,
        totalBedCost,
        dischargeDiagnosis: dto.dischargeDiagnosis,
        dischargeCondition: dto.dischargeCondition,
        notes: dto.notes ? `${admission.notes || ''}\n[Pulang]: ${dto.notes}` : admission.notes,
      },
      include: { bed: true, patient: true, doctor: true },
    });

    // Set bed status to cleaning
    await this.prisma.roomBed.update({
      where: { id: admission.bedId },
      data: { status: 'cleaning' },
    });

    // Automatically create invoice in billing
    const countInvoices = await this.prisma.invoice.count();
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${(100 + countInvoices + 1).toString()}`;

    await this.prisma.invoice.create({
      data: {
        hospitalId: admission.hospitalId,
        invoiceNumber,
        patientId: admission.patientId,
        patientName: admission.patient.name,
        doctorName: admission.doctor.name,
        serviceName: `Akomodasi Rawat Inap ${admission.bed.roomName} (${admission.bed.classType}) - ${totalDays} Hari`,
        amount: totalBedCost + 150000, // Bed cost + Jasa Visite Ranap
        status: 'Menunggu',
        paymentMethod: admission.patient.insuranceProvider || 'Umum / Mandiri',
      },
    });

    return discharged;
  }

  // ===================== CPPT (PROGRESS NOTES) =====================

  async getCPPT(admissionId: string) {
    return this.prisma.inpatientCPPT.findMany({
      where: { admissionId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async createCPPT(admissionId: string, dto: CreateCPPTDto) {
    const admission = await this.prisma.inpatientAdmission.findUnique({
      where: { id: admissionId },
    });
    if (!admission) throw new NotFoundException('Admisi rawat inap tidak ditemukan');

    return this.prisma.inpatientCPPT.create({
      data: {
        admissionId,
        recorderRole: dto.recorderRole,
        recorderName: dto.recorderName,
        subjective: dto.subjective,
        objective: dto.objective,
        assessment: dto.assessment,
        plan: dto.plan,
        instruction: dto.instruction,
        bloodPressure: dto.bloodPressure,
        heartRate: dto.heartRate,
        temperature: dto.temperature,
        respiratoryRate: dto.respiratoryRate,
        oxygenSaturation: dto.oxygenSaturation,
      },
    });
  }

  // ===================== SEED DEFAULT BEDS =====================

  private async seedDefaultBedsIfEmpty() {
    const count = await this.prisma.roomBed.count();
    if (count > 0) return;

    const hospitalId = await this.getValidHospitalId();

    const defaultBeds = [
      // VIP Suite
      { roomNumber: 'VIP-101', roomName: 'Paviliun Melati VIP 1', bedNumber: 'Bed A', classType: 'VIP', dailyRate: 850000, status: 'available', notes: 'Fasilitas Smart TV, Sofa Bed Penunggu, Kulkas, AC, Water Heater' },
      { roomNumber: 'VIP-102', roomName: 'Paviliun Melati VIP 2', bedNumber: 'Bed A', classType: 'VIP', dailyRate: 850000, status: 'available', notes: 'Fasilitas Smart TV, Sofa Bed Penunggu, Kulkas, AC, Water Heater' },

      // Kelas 1 (2 Bed per kamar)
      { roomNumber: 'R-201', roomName: 'Ruang Mawar 1', bedNumber: 'Bed 01', classType: 'Kelas 1', dailyRate: 450000, status: 'available', notes: 'Kamar isi 2 bed, AC, TV bersama, Nakas pasien' },
      { roomNumber: 'R-201', roomName: 'Ruang Mawar 1', bedNumber: 'Bed 02', classType: 'Kelas 1', dailyRate: 450000, status: 'available', notes: 'Kamar isi 2 bed, AC, TV bersama, Nakas pasien' },
      { roomNumber: 'R-202', roomName: 'Ruang Mawar 2', bedNumber: 'Bed 01', classType: 'Kelas 1', dailyRate: 450000, status: 'available', notes: 'Kamar isi 2 bed, AC, TV bersama, Nakas pasien' },
      { roomNumber: 'R-202', roomName: 'Ruang Mawar 2', bedNumber: 'Bed 02', classType: 'Kelas 1', dailyRate: 450000, status: 'available', notes: 'Kamar isi 2 bed, AC, TV bersama, Nakas pasien' },

      // Kelas 2 (4 Bed per kamar)
      { roomNumber: 'R-301', roomName: 'Ruang Dahlia 1', bedNumber: 'Bed 01', classType: 'Kelas 2', dailyRate: 275000, status: 'available', notes: 'Kamar isi 4 bed, AC, Nakas, Tirai privasi' },
      { roomNumber: 'R-301', roomName: 'Ruang Dahlia 1', bedNumber: 'Bed 02', classType: 'Kelas 2', dailyRate: 275000, status: 'available', notes: 'Kamar isi 4 bed, AC, Nakas, Tirai privasi' },
      { roomNumber: 'R-301', roomName: 'Ruang Dahlia 1', bedNumber: 'Bed 03', classType: 'Kelas 2', dailyRate: 275000, status: 'available', notes: 'Kamar isi 4 bed, AC, Nakas, Tirai privasi' },
      { roomNumber: 'R-301', roomName: 'Ruang Dahlia 1', bedNumber: 'Bed 04', classType: 'Kelas 2', dailyRate: 275000, status: 'available', notes: 'Kamar isi 4 bed, AC, Nakas, Tirai privasi' },

      // Kelas 3 (6 Bed per kamar)
      { roomNumber: 'R-401', roomName: 'Ruang Cempaka 1', bedNumber: 'Bed 01', classType: 'Kelas 3', dailyRate: 150000, status: 'available', notes: 'Kamar isi 6 bed, Ventilasi AC sentral, Tirai partisi' },
      { roomNumber: 'R-401', roomName: 'Ruang Cempaka 1', bedNumber: 'Bed 02', classType: 'Kelas 3', dailyRate: 150000, status: 'available', notes: 'Kamar isi 6 bed, Ventilasi AC sentral, Tirai partisi' },
      { roomNumber: 'R-401', roomName: 'Ruang Cempaka 1', bedNumber: 'Bed 03', classType: 'Kelas 3', dailyRate: 150000, status: 'available', notes: 'Kamar isi 6 bed, Ventilasi AC sentral, Tirai partisi' },
      { roomNumber: 'R-401', roomName: 'Ruang Cempaka 1', bedNumber: 'Bed 04', classType: 'Kelas 3', dailyRate: 150000, status: 'available', notes: 'Kamar isi 6 bed, Ventilasi AC sentral, Tirai partisi' },

      // ICU / HCU
      { roomNumber: 'ICU-01', roomName: 'Intensive Care Unit (ICU)', bedNumber: 'Bed ICU-1', classType: 'ICU', dailyRate: 1200000, status: 'available', notes: 'Bed electric, Bedside Monitor, Ventilator, Suction Central' },
      { roomNumber: 'ICU-01', roomName: 'Intensive Care Unit (ICU)', bedNumber: 'Bed ICU-2', classType: 'ICU', dailyRate: 1200000, status: 'available', notes: 'Bed electric, Bedside Monitor, Ventilator, Suction Central' },

      // Ruang Isolasi
      { roomNumber: 'ISO-01', roomName: 'Ruang Isolasi Tekanan Negatif', bedNumber: 'Bed ISO-1', classType: 'Isolasi', dailyRate: 750000, status: 'available', notes: 'Airflow HEPA filter tekanan negatif, Anteroom' },
    ];

    const createdBeds = [];
    for (const bed of defaultBeds) {
      const created = await this.prisma.roomBed.create({
        data: {
          hospitalId,
          roomNumber: bed.roomNumber,
          roomName: bed.roomName,
          bedNumber: bed.bedNumber,
          classType: bed.classType,
          dailyRate: bed.dailyRate,
          status: bed.status,
          notes: bed.notes,
        },
      });
      createdBeds.push(created);
    }

    // Seed 2 active sample inpatient admissions if patients and doctors exist
    try {
      const patient1 = await this.prisma.patient.findFirst({ where: { name: { contains: 'Raka' } } });
      const patient2 = await this.prisma.patient.findFirst({ where: { name: { contains: 'Siti' } } });
      const doctor1 = await this.prisma.doctor.findFirst({ where: { name: { contains: 'Hendra' } } }) || await this.prisma.doctor.findFirst();
      const doctor2 = await this.prisma.doctor.findFirst({ where: { name: { contains: 'Maya' } } }) || await this.prisma.doctor.findFirst();

      if (patient1 && doctor1 && createdBeds.length >= 3) {
        const bed1 = createdBeds[2]; // R-201 Bed 01
        await this.prisma.inpatientAdmission.create({
          data: {
            hospitalId,
            admissionNumber: 'RANAP-2026-001',
            patientId: patient1.id,
            doctorId: doctor1.id,
            bedId: bed1.id,
            admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            admissionType: 'IGD (Gawat Darurat)',
            initialDiagnosis: 'Demam Berdarah Dengue (DBD) Grade II',
            status: 'active',
            notes: 'Infus RL 20 tpm, monitoring trombosit serial tiap 12 jam',
          },
        });
        await this.prisma.roomBed.update({
          where: { id: bed1.id },
          data: { status: 'occupied' },
        });
      }

      if (patient2 && doctor2 && createdBeds.length >= 7) {
        const bed2 = createdBeds[6]; // R-301 Bed 01
        await this.prisma.inpatientAdmission.create({
          data: {
            hospitalId,
            admissionNumber: 'RANAP-2026-002',
            patientId: patient2.id,
            doctorId: doctor2.id,
            bedId: bed2.id,
            admissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            admissionType: 'Poliklinik',
            initialDiagnosis: 'Hipertensi Urgensi & Observasi Aritmia',
            status: 'active',
            notes: 'Diet rendah garam, observasi tanda vital berkala',
          },
        });
        await this.prisma.roomBed.update({
          where: { id: bed2.id },
          data: { status: 'occupied' },
        });
      }
    } catch (err) {
      // Non-blocking for admissions seeding
    }
  }
}
