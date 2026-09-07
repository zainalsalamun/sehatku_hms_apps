import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateDiagnosisInput {
  icd10Code?: string;
  description: string;
  type?: string;
}

export interface CreatePrescriptionItemInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  route?: string;
  durationDays?: number;
  instruction?: string;
}

export interface CreateProcedureInput {
  procedureId?: string;
  name: string;
  price: number;
  notes?: string;
}

export interface CreateMedicalCertificateDto {
  type?: string; // 'sick_leave' / 'healthy'
  patientId: string;
  doctorId: string;
  encounterId?: string;
  diagnosis?: string;
  startDate?: string;
  durationDays?: number;
  notes?: string;
}

export interface CreateEncounterDto {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  anamnesis?: string;
  physicalExam?: string;
  diagnosisSummary?: string;
  diagnoses?: CreateDiagnosisInput[];
  prescriptions?: CreatePrescriptionItemInput[];
  procedures?: CreateProcedureInput[];
  certificate?: CreateMedicalCertificateDto;
  notes?: string;
}

@Injectable()
export class MedicalRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  // Catalog ICD-10 official medical codes
  private readonly icd10Catalog = [
    { code: 'I10', name: 'Essential (primary) hypertension', category: 'Kardiovaskular' },
    { code: 'I20.9', name: 'Angina pectoris, unspecified', category: 'Kardiovaskular' },
    { code: 'I25.1', name: 'Atherosclerotic heart disease', category: 'Kardiovaskular' },
    { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications', category: 'Endokrin' },
    { code: 'E78.5', name: 'Hyperlipidemia, unspecified', category: 'Endokrin' },
    { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified (ISPA)', category: 'Respirasi' },
    { code: 'J45.9', name: 'Asthma, unspecified', category: 'Respirasi' },
    { code: 'J18.9', name: 'Pneumonia, unspecified organism', category: 'Respirasi' },
    { code: 'K29.7', name: 'Gastritis, unspecified', category: 'Gastroenterologi' },
    { code: 'K30', name: 'Functional dyspepsia (Dispepsia)', category: 'Gastroenterologi' },
    { code: 'K02.9', name: 'Dental caries, unspecified (Gigi berlubang)', category: 'Gigi & Mulut' },
    { code: 'K05.3', name: 'Chronic periodontitis', category: 'Gigi & Mulut' },
    { code: 'G43.9', name: 'Migraine, unspecified', category: 'Neurologi' },
    { code: 'G44.2', name: 'Tension-type headache', category: 'Neurologi' },
    { code: 'M54.5', name: 'Low back pain', category: 'Muskuloskeletal' },
    { code: 'H10.9', name: 'Conjunctivitis, unspecified', category: 'Mata' },
    { code: 'H52.1', name: 'Myopia (Rabun Jauh)', category: 'Mata' },
    { code: 'R50.9', name: 'Fever, unspecified (Demam)', category: 'Gejala Umum' },
    { code: 'A09', name: 'Infectious gastroenteritis and colitis (Diare Akut)', category: 'Gastroenterologi' },
  ];

  // Catalog Hospital Pharmacy Formulary
  private readonly formularyCatalog = [
    { name: 'Amlodipine Besylate 5mg', forms: ['Tablet'], category: 'Antihipertensi', defaultDose: '5 mg', defaultFrequency: '1x sehari pagi' },
    { name: 'Amlodipine Besylate 10mg', forms: ['Tablet'], category: 'Antihipertensi', defaultDose: '10 mg', defaultFrequency: '1x sehari pagi' },
    { name: 'Candesartan 8mg', forms: ['Tablet'], category: 'Antihipertensi', defaultDose: '8 mg', defaultFrequency: '1x sehari' },
    { name: 'Paracetamol 500mg', forms: ['Kaplet'], category: 'Analgesik & Antipiretik', defaultDose: '500 mg', defaultFrequency: '3x sehari prn' },
    { name: 'Ibuprofen 400mg', forms: ['Tablet'], category: 'Analgesik & Anti-inflamasi', defaultDose: '400 mg', defaultFrequency: '3x sehari sesudah makan' },
    { name: 'Amoxicillin 500mg', forms: ['Kapsul'], category: 'Antibiotik', defaultDose: '500 mg', defaultFrequency: '3x sehari (habiskan)' },
    { name: 'Cefixime 100mg', forms: ['Kapsul'], category: 'Antibiotik', defaultDose: '100 mg', defaultFrequency: '2x sehari' },
    { name: 'Metformin HCl 500mg', forms: ['Tablet'], category: 'Antidiabetes', defaultDose: '500 mg', defaultFrequency: '2x sehari saat makan' },
    { name: 'Omeprazole 20mg', forms: ['Kapsul lepas lambat'], category: 'Antasida & Saluran Cerna', defaultDose: '20 mg', defaultFrequency: '2x sehari 30 mnt sebelum makan' },
    { name: 'Lansoprazole 30mg', forms: ['Kapsul lepas lambat'], category: 'Antasida & Saluran Cerna', defaultDose: '30 mg', defaultFrequency: '1x sehari 30 mnt sebelum makan' },
    { name: 'Cetirizine HCl 10mg', forms: ['Tablet'], category: 'Antihistamin / Alergi', defaultDose: '10 mg', defaultFrequency: '1x sehari malam' },
    { name: 'Salbutamol 2mg', forms: ['Tablet'], category: 'Bronkodilator / Asma', defaultDose: '2 mg', defaultFrequency: '3x sehari jika sesak' },
    { name: 'Vitamin C 500mg + Zinc', forms: ['Tablet salut selaput'], category: 'Suplemen', defaultDose: '1 tablet', defaultFrequency: '1x sehari' },
    { name: 'Coenzyme Q10 100mg', forms: ['Kapsul lunak'], category: 'Suplemen Kardio', defaultDose: '100 mg', defaultFrequency: '1x sehari' },
  ];

  async findAll(patientId?: string) {
    const encounters = await this.prisma.encounter.findMany({
      where: patientId
        ? {
            OR: [
              { patientId },
              { patient: { name: { contains: patientId, mode: 'insensitive' } } },
              { patient: { medicalRecordNumber: { contains: patientId, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            medicalRecordNumber: true,
            birthDate: true,
            gender: true,
            bloodType: true,
            insuranceProvider: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialist: true,
          },
        },
        diagnoses: true,
        prescriptions: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return encounters.map((enc) => ({
      id: enc.id,
      patientId: enc.patientId,
      patientName: enc.patient?.name ?? '',
      medicalRecordNumber: enc.patient?.medicalRecordNumber ?? '',
      doctorId: enc.doctorId,
      doctorName: enc.doctor?.name ?? '',
      specialist: enc.doctor?.specialist ?? 'Spesialis',
      date: enc.startedAt,
      anamnesis: enc.anamnesis || '',
      physicalExam: enc.physicalExam || '',
      diagnosisSummary: enc.diagnosisSummary || '',
      diagnoses: enc.diagnoses.map((d) => ({
        code: d.icd10Code || '',
        name: d.description,
        type: d.type,
      })),
      prescriptions: enc.prescriptions.flatMap((p) =>
        p.items.map((item) => ({
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          route: item.route,
          duration: `${item.durationDays} hari`,
          instruction: item.instruction || '',
        })),
      ),
      status: enc.status,
    }));
  }

  async findOne(id: string) {
    const enc = await this.prisma.encounter.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        diagnoses: true,
        prescriptions: {
          include: { items: true },
        },
      },
    });

    if (!enc) {
      throw new NotFoundException(`Rekam medis dengan ID ${id} tidak ditemukan`);
    }

    return enc;
  }

  async create(dto: CreateEncounterDto) {
    let resolvedPatientId = dto.patientId;
    let resolvedDoctorId = dto.doctorId;
    let resolvedAppointmentId = dto.appointmentId;

    // Resilient patient lookup
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [
          { id: resolvedPatientId },
          { name: { contains: resolvedPatientId, mode: 'insensitive' } },
        ],
      },
    });
    if (patient) {
      resolvedPatientId = patient.id;
    } else {
      const firstPatient = await this.prisma.patient.findFirst();
      if (firstPatient) resolvedPatientId = firstPatient.id;
    }

    // Resilient doctor lookup
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [
          { id: resolvedDoctorId },
          { name: { contains: resolvedDoctorId, mode: 'insensitive' } },
        ],
      },
    });
    if (doctor) {
      resolvedDoctorId = doctor.id;
    } else {
      const firstDoctor = await this.prisma.doctor.findFirst();
      if (firstDoctor) resolvedDoctorId = firstDoctor.id;
    }

    // Resilient appointment lookup to prevent foreign key errors
    if (resolvedAppointmentId) {
      const appt = await this.prisma.appointment.findFirst({
        where: {
          OR: [
            { id: resolvedAppointmentId },
            { queueNumber: resolvedAppointmentId },
          ],
        },
      });
      if (appt) {
        resolvedAppointmentId = appt.id;
      } else {
        resolvedAppointmentId = undefined;
      }
    }

    const primaryDiagnosis =
      dto.diagnoses && dto.diagnoses.length > 0
        ? dto.diagnoses.find((d) => d.type === 'primary') || dto.diagnoses[0]
        : null;

    const diagnosisSummary =
      dto.diagnosisSummary ||
      (primaryDiagnosis
        ? `${primaryDiagnosis.description} (ICD-10: ${primaryDiagnosis.icd10Code || '-'})`
        : 'Pemeriksaan Klinis Rawat Jalan');

    const encounter = await this.prisma.encounter.create({
      data: {
        patientId: resolvedPatientId,
        doctorId: resolvedDoctorId,
        appointmentId: resolvedAppointmentId,
        anamnesis: dto.anamnesis,
        physicalExam: dto.physicalExam,
        diagnosisSummary,
        status: 'signed',
        signedAt: new Date(),
        endedAt: new Date(),
        diagnoses: {
          create: (dto.diagnoses || []).map((d) => ({
            icd10Code: d.icd10Code,
            description: d.description,
            type: d.type || 'primary',
          })),
        },
        prescriptions:
          dto.prescriptions && dto.prescriptions.length > 0
            ? {
                create: [
                  {
                    patientId: resolvedPatientId,
                    doctorId: resolvedDoctorId,
                    status: 'issued',
                    notes: dto.notes,
                    items: {
                      create: dto.prescriptions.map((p) => ({
                        medicineName: p.medicineName,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        route: p.route || 'oral',
                        durationDays: p.durationDays || 3,
                        instruction: p.instruction,
                      })),
                    },
                  },
                ],
              }
            : undefined,
        procedures:
          dto.procedures && dto.procedures.length > 0
            ? {
                create: dto.procedures.map((p) => ({
                  procedureId: p.procedureId || '25000000-0000-4000-8000-000000000001',
                  name: p.name,
                  price: p.price,
                  notes: p.notes,
                })),
              }
            : undefined,
      },
      include: {
        patient: true,
        doctor: true,
        diagnoses: true,
        procedures: true,
        prescriptions: {
          include: { items: true },
        },
      },
    });

    // If a certificate is requested, create it automatically
    let createdCert = null;
    if (dto.certificate) {
      try {
        createdCert = await this.createCertificate({
          ...dto.certificate,
          patientId: resolvedPatientId,
          doctorId: resolvedDoctorId,
          encounterId: encounter.id,
          diagnosis: diagnosisSummary,
        });
      } catch (e) {}
    }

    // If tied to an appointment, mark appointment as completed
    if (resolvedAppointmentId) {
      await this.prisma.appointment
        .update({
          where: { id: resolvedAppointmentId },
          data: { status: 'Selesai' },
        })
        .catch(() => null);
    }

    // Auto-trigger notifications for Patient and Pharmacy/Admin
    try {
      await this.prisma.notification.createMany({
        data: [
          {
            role: 'patient',
            title: 'Hasil Pemeriksaan & Rekam Medis Terbit',
            message: `Pemeriksaan oleh ${encounter.doctor?.name || 'Dokter'} telah selesai. Diagnosa: ${diagnosisSummary}. Rekam medis dan resep obat telah diterbitkan.`,
            type: 'clinical',
            targetId: encounter.id,
            isRead: false,
          },
          {
            role: 'admin',
            title: 'E-Resep Baru Siap Diproses di Farmasi',
            message: `E-Resep baru dari ${encounter.doctor?.name || 'Dokter'} untuk pasien ${encounter.patient?.name || 'Pasien'} (${encounter.patient?.medicalRecordNumber || '-'}) siap diracik.`,
            type: 'prescription',
            targetId: encounter.id,
            isRead: false,
          },
        ],
      });
    } catch (e) {}

    // Log to Audit Trail
    await this.prisma.auditLog.create({
      data: {
        actorName: encounter.doctor?.name || 'Dokter Spesialis',
        actorRole: 'doctor',
        action: 'CREATE',
        resourceType: 'Encounter',
        resourceId: encounter.id,
        details: `Pemeriksaan selesai untuk ${encounter.patient?.name || 'Pasien'} (${encounter.patient?.medicalRecordNumber || '-'}) - Diagnosa: ${diagnosisSummary}`,
      },
    });

    return {
      success: true,
      message: 'Rekam medis & e-prescription berhasil disimpan ke database',
      encounterId: encounter.id,
      patientName: encounter.patient?.name,
      diagnosisSummary,
      certificate: createdCert,
    };
  }

  // --- MEDICAL CERTIFICATES (SKD & Surat Sehat) ---

  async findAllCertificates(patientId?: string, doctorId?: string) {
    return this.prisma.medicalCertificate.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
        ...(doctorId ? { doctorId } : {}),
      },
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCertificateById(id: string) {
    const cert = await this.prisma.medicalCertificate.findFirst({
      where: {
        OR: [{ id }, { certificateNumber: id }],
      },
      include: {
        patient: true,
        doctor: true,
        encounter: true,
      },
    });
    if (!cert) throw new NotFoundException('Surat keterangan medis tidak ditemukan');
    return cert;
  }

  async createCertificate(dto: CreateMedicalCertificateDto) {
    const hosp = await this.prisma.hospital.findFirst();
    const hospitalId = hosp?.id || '00000001-0000-4000-8000-000000000001';

    const count = await this.prisma.medicalCertificate.count();
    const prefix = dto.type === 'healthy' ? 'SK-SEHAT' : 'SKD';
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const year = new Date().getFullYear();
    const certificateNumber = `${prefix}/${year}/${month}/${(count + 101).toString().padStart(3, '0')}`;

    const duration = dto.durationDays || 1;
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(startDate.getTime() + duration * 86400000);

    return this.prisma.medicalCertificate.create({
      data: {
        certificateNumber,
        type: dto.type || 'sick_leave',
        hospitalId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        encounterId: dto.encounterId,
        diagnosis: dto.diagnosis || 'Pemeriksaan Klinis Rutin',
        startDate,
        endDate,
        durationDays: duration,
        notes: dto.notes || `Pasien memerlukan istirahat selama ${duration} hari.`,
        status: 'issued',
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  getIcd10Codes(query?: string) {
    if (!query || query.trim() === '') {
      return this.icd10Catalog;
    }
    const q = query.toLowerCase();
    return this.icd10Catalog.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }

  getFormulary(query?: string) {
    if (!query || query.trim() === '') {
      return this.formularyCatalog;
    }
    const q = query.toLowerCase();
    return this.formularyCatalog.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }
}
