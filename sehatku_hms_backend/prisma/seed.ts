import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Comprehensive SehatKu HMS Database Seeding (Standard UUID v4)...');

  // 1. Hospital
  const hospital = await prisma.hospital.upsert({
    where: { code: 'SEHATKU-JKT' },
    update: {},
    create: {
      id: '00000001-0000-4000-8000-000000000001',
      code: 'SEHATKU-JKT',
      name: 'SehatKu Medical Center Jakarta',
      timezone: 'Asia/Jakarta',
      address: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan',
      phone: '+62-21-555-8900',
      email: 'info@sehatku-hospital.id',
      status: 'active',
    },
  });

  // 2. Roles
  const roles = [
    { id: '00000002-0000-4000-8000-000000000001', code: 'super_admin', name: 'Super Administrator' },
    { id: '00000002-0000-4000-8000-000000000002', code: 'hospital_admin', name: 'Hospital Administrator' },
    { id: '00000002-0000-4000-8000-000000000003', code: 'doctor', name: 'Dokter' },
    { id: '00000002-0000-4000-8000-000000000004', code: 'receptionist', name: 'Resepsionis' },
    { id: '00000002-0000-4000-8000-000000000005', code: 'cashier', name: 'Kasir' },
    { id: '00000002-0000-4000-8000-000000000006', code: 'patient', name: 'Pasien' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  // 3. Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    {
      id: '10000000-0000-4000-8000-000000000001',
      email: 'admin@sehatku.id',
      fullName: 'Budi Santoso (Admin)',
      phone: '0811-0000-0001',
      roleCode: 'hospital_admin',
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      email: 'doctor@sehatku.id',
      fullName: 'dr. Maya Pratama, Sp.JP',
      phone: '0812-3456-7890',
      roleCode: 'doctor',
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      email: 'rafi@sehatku.id',
      fullName: 'drg. Rafi Akbar, Sp.KG',
      phone: '0813-9876-5432',
      roleCode: 'doctor',
    },
    {
      id: '10000000-0000-4000-8000-000000000004',
      email: 'patient@sehatku.id',
      fullName: 'Nadia Putri',
      phone: '0812-9988-7766',
      roleCode: 'patient',
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        passwordHash,
      },
    });

    const role = await prisma.role.findUnique({ where: { code: u.roleCode } });
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId_hospitalId: {
            userId: user.id,
            roleId: role.id,
            hospitalId: hospital.id,
          },
        },
        update: {},
        create: {
          id: `00000003-0000-4000-8000-${user.id.substring(user.id.length - 12)}`,
          userId: user.id,
          roleId: role.id,
          hospitalId: hospital.id,
        },
      });
    }
  }

  // 4. Departments
  const departments = [
    { id: '20000000-0000-4000-8000-000000000001', code: 'KARDIO', name: 'Kardiologi & Vaskular' },
    { id: '20000000-0000-4000-8000-000000000002', code: 'DENTAL', name: 'Kesehatan Gigi & Mulut' },
    { id: '20000000-0000-4000-8000-000000000003', code: 'PEDIATRI', name: 'Pediatri & Tumbuh Kembang' },
    { id: '20000000-0000-4000-8000-000000000004', code: 'NEURO', name: 'Neurologi & Saraf' },
    { id: '20000000-0000-4000-8000-000000000005', code: 'INTERNA', name: 'Penyakit Dalam' },
    { id: '20000000-0000-4000-8000-000000000006', code: 'MATA', name: 'Mata (Oftalmologi)' },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: {
        hospitalId_code: {
          hospitalId: hospital.id,
          code: d.code,
        },
      },
      update: {},
      create: {
        id: d.id,
        hospitalId: hospital.id,
        code: d.code,
        name: d.name,
      },
    });
  }

  // 5. Doctors
  const doctors = [
    {
      id: '30000000-0000-4000-8000-000000000001',
      userId: '10000000-0000-4000-8000-000000000002',
      departmentId: '20000000-0000-4000-8000-000000000001',
      licenseNumber: 'SIP.449.1/023/2021',
      name: 'dr. Maya Pratama, Sp.JP',
      specialist: 'Kardiologi & Vaskular',
      experienceYears: 12,
      rating: 4.95,
      scheduleDays: ['Senin', 'Rabu', 'Jumat'],
      email: 'maya.pratama@sehatku-hospital.id',
      phone: '0812-3456-7890',
      availableToday: true,
      status: 'active',
    },
    {
      id: '30000000-0000-4000-8000-000000000002',
      userId: '10000000-0000-4000-8000-000000000003',
      departmentId: '20000000-0000-4000-8000-000000000002',
      licenseNumber: 'SIP.449.1/045/2020',
      name: 'drg. Rafi Akbar, Sp.KG',
      specialist: 'Kesehatan Gigi & Mulut',
      experienceYears: 8,
      rating: 4.9,
      scheduleDays: ['Selasa', 'Kamis', 'Sabtu'],
      email: 'rafi.akbar@sehatku-hospital.id',
      phone: '0813-9876-5432',
      availableToday: true,
      status: 'active',
    },
    {
      id: '30000000-0000-4000-8000-000000000003',
      departmentId: '20000000-0000-4000-8000-000000000003',
      licenseNumber: 'SIP.449.1/089/2022',
      name: 'dr. Sarah Olivia, Sp.A',
      specialist: 'Pediatri & Tumbuh Kembang',
      experienceYears: 10,
      rating: 4.88,
      scheduleDays: ['Senin', 'Selasa', 'Rabu'],
      email: 'sarah.olivia@sehatku-hospital.id',
      phone: '0811-2233-4455',
      availableToday: false,
      status: 'active',
    },
    {
      id: '30000000-0000-4000-8000-000000000004',
      departmentId: '20000000-0000-4000-8000-000000000004',
      licenseNumber: 'SIP.449.1/012/2018',
      name: 'dr. Bima Santoso, Sp.S',
      specialist: 'Neurologi & Saraf',
      experienceYears: 15,
      rating: 4.7,
      scheduleDays: ['Rabu', 'Kamis', 'Jumat'],
      email: 'bima.santoso@sehatku-hospital.id',
      phone: '0815-6677-8899',
      availableToday: true,
      status: 'active',
    },
    {
      id: '30000000-0000-4000-8000-000000000005',
      departmentId: '20000000-0000-4000-8000-000000000005',
      licenseNumber: 'SIP.449.1/077/2019',
      name: 'dr. Hendra Wijaya, Sp.PD',
      specialist: 'Penyakit Dalam',
      experienceYears: 14,
      rating: 4.85,
      scheduleDays: ['Senin', 'Selasa', 'Rabu', 'Kamis'],
      email: 'hendra.wijaya@sehatku-hospital.id',
      phone: '0817-1122-3344',
      availableToday: true,
      status: 'inactive',
    },
  ];

  for (const doc of doctors) {
    await prisma.doctor.upsert({
      where: {
        hospitalId_licenseNumber: {
          hospitalId: hospital.id,
          licenseNumber: doc.licenseNumber,
        },
      },
      update: {},
      create: {
        ...doc,
        hospitalId: hospital.id,
      },
    });
  }

  // 6. Patients
  const patients = [
    {
      id: '40000000-0000-4000-8000-000000000001',
      userId: '10000000-0000-4000-8000-000000000004',
      medicalRecordNumber: 'MRN-2026-001',
      nik: '3201123456780001',
      name: 'Nadia Putri',
      birthDate: new Date('1995-04-12'),
      gender: 'Perempuan',
      bloodType: 'O+',
      insuranceProvider: 'BPJS Kesehatan Mandiri',
      phone: '0812-9988-7766',
      email: 'nadia.putri@gmail.com',
      address: 'Jl. Melati No. 14, Jakarta Selatan',
      emergencyContact: 'Dimas (Suami) - 0812-9988-7700',
    },
    {
      id: '40000000-0000-4000-8000-000000000002',
      medicalRecordNumber: 'MRN-2026-002',
      nik: '3201123456780002',
      name: 'Raka Mahendra',
      birthDate: new Date('1988-11-23'),
      gender: 'Laki-laki',
      bloodType: 'A+',
      insuranceProvider: 'Prudential Health',
      phone: '0813-1122-3344',
      email: 'raka.mahendra@gmail.com',
      address: 'Jl. Kebon Jeruk No. 88, Jakarta Barat',
      emergencyContact: 'Rina (Istri) - 0813-1122-3300',
    },
    {
      id: '40000000-0000-4000-8000-000000000003',
      medicalRecordNumber: 'MRN-2026-003',
      nik: '3201123456780003',
      name: 'Siti Rahmawati',
      birthDate: new Date('2000-08-15'),
      gender: 'Perempuan',
      bloodType: 'B+',
      insuranceProvider: 'Umum / Mandiri',
      phone: '0817-5566-7788',
      email: 'siti.rahmawati@gmail.com',
      address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
      emergencyContact: 'Budi (Ayah) - 0817-5566-7700',
    },
  ];

  for (const p of patients) {
    await prisma.patient.upsert({
      where: {
        hospitalId_medicalRecordNumber: {
          hospitalId: hospital.id,
          medicalRecordNumber: p.medicalRecordNumber,
        },
      },
      update: {},
      create: {
        ...p,
        hospitalId: hospital.id,
      },
    });
  }

  // 7. Appointments & Queue Tickets
  const appointments = [
    {
      id: '50000000-0000-4000-8000-000000000001',
      doctorId: '30000000-0000-4000-8000-000000000001',
      patientId: '40000000-0000-4000-8000-000000000001',
      dateLabel: 'Hari ini',
      appointmentTime: '09:30 WIB',
      queueNumber: 'A-001',
      departmentName: 'Kardiologi & Vaskular',
      reason: 'Kontrol rutin hipertensi dan cek EKG berkala',
      status: 'Checked-in',
      ticketId: '55000000-0000-4000-8000-000000000001',
    },
    {
      id: '50000000-0000-4000-8000-000000000002',
      doctorId: '30000000-0000-4000-8000-000000000001',
      patientId: '40000000-0000-4000-8000-000000000002',
      dateLabel: 'Hari ini',
      appointmentTime: '10:00 WIB',
      queueNumber: 'A-002',
      departmentName: 'Kardiologi & Vaskular',
      reason: 'Nyeri dada saat berolahraga ringan',
      status: 'Menunggu',
      ticketId: '55000000-0000-4000-8000-000000000002',
    },
    {
      id: '50000000-0000-4000-8000-000000000003',
      doctorId: '30000000-0000-4000-8000-000000000002',
      patientId: '40000000-0000-4000-8000-000000000003',
      dateLabel: 'Hari ini',
      appointmentTime: '10:30 WIB',
      queueNumber: 'B-001',
      departmentName: 'Kesehatan Gigi & Mulut',
      reason: 'Pembersihan karang gigi & scaling rutin',
      status: 'Menunggu',
      ticketId: '55000000-0000-4000-8000-000000000003',
    },
    {
      id: '50000000-0000-4000-8000-000000000004',
      doctorId: '30000000-0000-4000-8000-000000000003',
      patientId: '40000000-0000-4000-8000-000000000001',
      dateLabel: 'Besok',
      appointmentTime: '11:00 WIB',
      queueNumber: 'C-005',
      departmentName: 'Pediatri & Tumbuh Kembang',
      reason: 'Imunisasi lanjutan & konsultasi gizi anak',
      status: 'Terkonfirmasi',
      ticketId: '55000000-0000-4000-8000-000000000004',
    },
    {
      id: '50000000-0000-4000-8000-000000000005',
      doctorId: '30000000-0000-4000-8000-000000000004',
      patientId: '40000000-0000-4000-8000-000000000002',
      dateLabel: 'Kemarin',
      appointmentTime: '14:00 WIB',
      queueNumber: 'D-012',
      departmentName: 'Neurologi & Saraf',
      reason: 'Migrain berulang sisi kanan',
      status: 'Selesai',
      ticketId: '55000000-0000-4000-8000-000000000005',
    },
  ];

  for (const a of appointments) {
    const { ticketId, ...apptData } = a;
    const appt = await prisma.appointment.upsert({
      where: { id: apptData.id },
      update: {},
      create: {
        ...apptData,
        hospitalId: hospital.id,
      },
    });

    await prisma.queueTicket.upsert({
      where: { appointmentId: appt.id },
      update: {},
      create: {
        id: ticketId,
        appointmentId: appt.id,
        prefix: appt.queueNumber.split('-')[0],
        sequence: parseInt(appt.queueNumber.split('-')[1], 10),
        queueNumber: appt.queueNumber,
        status: appt.status === 'Checked-in' ? 'called' : (appt.status === 'Selesai' ? 'completed' : 'waiting'),
      },
    });
  }

  // 8. Clinical Encounters, Diagnoses & Prescriptions
  const encounters = [
    {
      id: '60000000-0000-4000-8000-000000000001',
      appointmentId: '50000000-0000-4000-8000-000000000001',
      patientId: '40000000-0000-4000-8000-000000000001',
      doctorId: '30000000-0000-4000-8000-000000000001',
      anamnesis: 'Pasien datang untuk kontrol tensi berkala. Mengeluhkan pusing ringan di bagian tengkuk leher jika lembur kerja.',
      physicalExam: 'Keadaan Umum: Baik, Compos Mentis. TD: 135/85 mmHg, Nadi: 78x/menit regular, RR: 18x/menit, Suhu: 36.6 C, SpO2: 99%. Jantung: S1-S2 murni regular, murmur (-), gallop (-).',
      diagnosisSummary: 'Hipertensi Primer Esensial (ICD-10: I10)',
      status: 'signed',
      signedAt: new Date(),
      diagnoses: [
        {
          id: '65000000-0000-4000-8000-000000000001',
          icd10Code: 'I10',
          description: 'Essential (primary) hypertension',
          type: 'primary',
        },
      ],
      prescription: {
        id: '70000000-0000-4000-8000-000000000001',
        patientId: '40000000-0000-4000-8000-000000000001',
        doctorId: '30000000-0000-4000-8000-000000000001',
        status: 'ready',
        notes: 'Minum obat teratur di pagi hari, kurangi konsumsi garam berlebih & kelola stres.',
        items: [
          {
            id: '75000000-0000-4000-8000-000000000001',
            medicineName: 'Amlodipine Besylate 5mg',
            dosage: '5 mg',
            frequency: '1x sehari pagi',
            route: 'oral',
            durationDays: 30,
            instruction: 'Diminum sesudah makan pagi',
          },
          {
            id: '75000000-0000-4000-8000-000000000002',
            medicineName: 'Candesartan 8mg',
            dosage: '8 mg',
            frequency: '1x sehari malam',
            route: 'oral',
            durationDays: 30,
            instruction: 'Diminum sebelum tidur',
          },
        ],
      },
    },
    {
      id: '60000000-0000-4000-8000-000000000002',
      appointmentId: '50000000-0000-4000-8000-000000000005',
      patientId: '40000000-0000-4000-8000-000000000002',
      doctorId: '30000000-0000-4000-8000-000000000004',
      anamnesis: 'Keluhan sakit kepala berdenyut sebelah kanan sejak 2 hari yang lalu, disertai mual ringan.',
      physicalExam: 'TD: 120/80 mmHg, Nadi: 80x/menit, Suhu: 36.8 C. Pemeriksaan neurologis kranial dalam batas normal.',
      diagnosisSummary: 'Migraine without aura (ICD-10: G43.0)',
      status: 'signed',
      signedAt: new Date(Date.now() - 86400000),
      diagnoses: [
        {
          id: '65000000-0000-4000-8000-000000000002',
          icd10Code: 'G43.0',
          description: 'Migraine without aura',
          type: 'primary',
        },
      ],
      prescription: {
        id: '70000000-0000-4000-8000-000000000002',
        patientId: '40000000-0000-4000-8000-000000000002',
        doctorId: '30000000-0000-4000-8000-000000000004',
        status: 'dispensed',
        notes: 'Istirahat di ruangan redup, minum pereda nyeri jika serangan timbul.',
        items: [
          {
            id: '75000000-0000-4000-8000-000000000003',
            medicineName: 'Paracetamol 500mg',
            dosage: '500 mg',
            frequency: '3x sehari prn',
            route: 'oral',
            durationDays: 5,
            instruction: 'Bila nyeri kepala kambuh',
          },
        ],
      },
    },
  ];

  for (const enc of encounters) {
    const { diagnoses, prescription, ...encData } = enc;
    const encounter = await prisma.encounter.upsert({
      where: { id: encData.id },
      update: {},
      create: encData,
    });

    for (const d of diagnoses) {
      await prisma.diagnosis.upsert({
        where: { id: d.id },
        update: {},
        create: {
          ...d,
          encounterId: encounter.id,
        },
      });
    }

    if (prescription) {
      const { items, ...rxData } = prescription;
      const rx = await prisma.prescription.upsert({
        where: { id: rxData.id },
        update: {},
        create: {
          ...rxData,
          encounterId: encounter.id,
        },
      });

      for (const item of items) {
        await prisma.prescriptionItem.upsert({
          where: { id: item.id },
          update: {},
          create: {
            ...item,
            prescriptionId: rx.id,
          },
        });
      }
    }
  }

  // 9. Invoices
  const invoices = [
    {
      id: '80000000-0000-4000-8000-000000000001',
      invoiceNumber: 'INV-2026-101',
      appointmentId: '50000000-0000-4000-8000-000000000001',
      patientId: '40000000-0000-4000-8000-000000000001',
      patientName: 'Nadia Putri',
      doctorName: 'dr. Maya Pratama, Sp.JP',
      serviceName: 'Konsultasi Poli Kardiologi & EKG',
      amount: 350000,
      status: 'Lunas',
      paymentMethod: 'QRIS Dinamis',
      paidAt: new Date(),
    },
    {
      id: '80000000-0000-4000-8000-000000000002',
      invoiceNumber: 'INV-2026-102',
      appointmentId: '50000000-0000-4000-8000-000000000002',
      patientId: '40000000-0000-4000-8000-000000000002',
      patientName: 'Raka Mahendra',
      doctorName: 'dr. Maya Pratama, Sp.JP',
      serviceName: 'Konsultasi Poli Kardiologi',
      amount: 250000,
      status: 'Menunggu',
      paymentMethod: 'Tunai',
    },
    {
      id: '80000000-0000-4000-8000-000000000003',
      invoiceNumber: 'INV-2026-103',
      appointmentId: '50000000-0000-4000-8000-000000000003',
      patientId: '40000000-0000-4000-8000-000000000003',
      patientName: 'Siti Rahmawati',
      doctorName: 'drg. Rafi Akbar, Sp.KG',
      serviceName: 'Tindakan Scaling Gigi & Konsultasi',
      amount: 450000,
      status: 'Menunggu',
      paymentMethod: 'Debit BCA',
    },
    {
      id: '80000000-0000-4000-8000-000000000004',
      invoiceNumber: 'INV-2026-104',
      appointmentId: '50000000-0000-4000-8000-000000000005',
      patientId: '40000000-0000-4000-8000-000000000002',
      patientName: 'Raka Mahendra',
      doctorName: 'dr. Bima Santoso, Sp.S',
      serviceName: 'Konsultasi Poli Saraf & Resep',
      amount: 320000,
      status: 'Lunas',
      paymentMethod: 'Transfer Bank Mandiri',
      paidAt: new Date(Date.now() - 86400000),
    },
  ];

  for (const inv of invoices) {
    await prisma.invoice.upsert({
      where: { invoiceNumber: inv.invoiceNumber },
      update: {},
      create: {
        ...inv,
        hospitalId: hospital.id,
      },
    });
  }

  // 10. Audit Logs
  const auditLogs = [
    {
      id: '99000000-0000-4000-8000-000000000001',
      actorName: 'Budi Santoso',
      actorRole: 'hospital_admin',
      action: 'LOGIN',
      resourceType: 'User',
      resourceId: '10000000-0000-4000-8000-000000000001',
      details: 'Login berhasil ke Dashboard Operations Console',
    },
    {
      id: '99000000-0000-4000-8000-000000000002',
      actorName: 'dr. Maya Pratama, Sp.JP',
      actorRole: 'doctor',
      action: 'CREATE',
      resourceType: 'Encounter',
      resourceId: '60000000-0000-4000-8000-000000000001',
      details: 'Pemeriksaan selesai untuk Nadia Putri (MRN-2026-001) - Diagnosa: Hipertensi Primer',
    },
    {
      id: '99000000-0000-4000-8000-000000000003',
      actorName: 'Siti Rahma',
      actorRole: 'receptionist',
      action: 'CREATE',
      resourceType: 'Patient',
      resourceId: '40000000-0000-4000-8000-000000000001',
      details: 'Pendaftaran pasien baru MRN-2026-001 (Nadia Putri)',
    },
    {
      id: '99000000-0000-4000-8000-000000000004',
      actorName: 'Siti Rahma',
      actorRole: 'receptionist',
      action: 'CHECK_IN',
      resourceType: 'Appointment',
      resourceId: '50000000-0000-4000-8000-000000000001',
      details: 'Pasien Nadia Putri melakukan check-in antrean A-001',
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {},
      create: {
        ...log,
        hospitalId: hospital.id,
      },
    });
  }

  // 11. Initial Notifications
  const notifications = [
    {
      id: '90000000-0000-4000-8000-000000000001',
      role: 'patient',
      title: 'Reservasi Poli Kardiologi Terkonfirmasi',
      message: 'Reservasi Anda dengan dr. Maya Pratama, Sp.JP pada pukul 09:30 WIB telah terdaftar dengan Nomor Antrean A-001.',
      type: 'appointment',
      targetId: '50000000-0000-4000-8000-000000000001',
      isRead: false,
    },
    {
      id: '90000000-0000-4000-8000-000000000002',
      role: 'patient',
      title: 'Kwitansi Pembayaran Resmi Terbit',
      message: 'Pembayaran tagihan invoice INV-2026-101 telah lunas via QRIS Dinamis sebesar Rp 350.000.',
      type: 'billing',
      targetId: '80000000-0000-4000-8000-000000000001',
      isRead: false,
    },
    {
      id: '90000000-0000-4000-8000-000000000003',
      role: 'doctor',
      title: 'Jadwal Praktek & Antrean Pasien Hari Ini',
      message: 'Anda memiliki antrean pasien terdaftar di Poli Kardiologi. Antrean pertama: Nadia Putri (A-001).',
      type: 'appointment',
      targetId: '50000000-0000-4000-8000-000000000001',
      isRead: false,
    },
    {
      id: '90000000-0000-4000-8000-000000000004',
      role: 'admin',
      title: 'Peringatan Stok Obat Farmasi',
      message: 'Stok Omeprazole 20mg tersisa 25 strip (di bawah batas minimum 80 strip). Harap segera lakukan restock.',
      type: 'prescription',
      targetId: 'med-4',
      isRead: false,
    },
    {
      id: '90000000-0000-4000-8000-000000000005',
      role: 'admin',
      title: 'Pelunasan Kasir POS Berhasil',
      message: 'Tagihan INV-2026-101 atas nama Nadia Putri telah diselesaikan via QRIS Dinamis sebesar Rp 350.000.',
      type: 'billing',
      targetId: '80000000-0000-4000-8000-000000000001',
      isRead: true,
    },
  ];

  // 12. Clinic Master Procedures
  const procedures = [
    {
      id: '25000000-0000-4000-8000-000000000001',
      code: 'PROC-001',
      name: 'Konsultasi Dokter & Pemeriksaan Fisik',
      category: 'Umum',
      description: 'Pemeriksaan tanda vital, konsultasi keluhan, dan diagnosa dokter.',
      price: 50000,
      status: 'active',
    },
    {
      id: '25000000-0000-4000-8000-000000000002',
      code: 'PROC-002',
      name: 'Scaling Gigi (Pembersihan Karang)',
      category: 'Gigi',
      description: 'Pembersihan plak dan kalkulus supragingival seluruh regio gigi.',
      price: 150000,
      status: 'active',
    },
    {
      id: '25000000-0000-4000-8000-000000000003',
      code: 'PROC-003',
      name: 'Injeksi Obat / Vitamin Booster',
      category: 'Tindakan Medis',
      description: 'Pemberian injeksi intramuskular/intravena multivitamin atau pereda nyeri.',
      price: 45000,
      status: 'active',
    },
    {
      id: '25000000-0000-4000-8000-000000000004',
      code: 'PROC-004',
      name: 'Nebulizer Inhalasi Saluran Nafas',
      category: 'Tindakan Medis',
      description: 'Terapi uap bronkodilator untuk pasien asma atau sesak batuk berdahak.',
      price: 75000,
      status: 'active',
    },
    {
      id: '25000000-0000-4000-8000-000000000005',
      code: 'PROC-005',
      name: 'Rawat Luka & Ganti Verban',
      category: 'Keperawatan',
      description: 'Pembersihan luka terbuka, antiseptik, dan penggantian balutan kasa steril.',
      price: 35000,
      status: 'active',
    },
    {
      id: '25000000-0000-4000-8000-000000000006',
      code: 'PROC-006',
      name: 'Penjahitan Luka (Hecting)',
      category: 'Tindakan Medis',
      description: 'Anestesi lokal dan penjahitan luka robek sederhana 1-3 jahitan.',
      price: 120000,
      status: 'active',
    },
    {
      id: '25000000-0000-4000-8000-000000000007',
      code: 'PROC-007',
      name: 'Cek Gula Darah Sewaktu (Strip)',
      category: 'Laboratorium Rapid',
      description: 'Pemeriksaan glukosa darah kapiler instan (1 menit).',
      price: 25000,
      status: 'active',
    },
    {
      id: '25000000-0000-4000-8000-000000000008',
      code: 'PROC-008',
      name: 'Cek Asam Urat (Strip)',
      category: 'Laboratorium Rapid',
      description: 'Pemeriksaan kadar asam urat kapiler instan.',
      price: 25000,
      status: 'active',
    },
    {
      id: '25000000-0000-4000-8000-000000000009',
      code: 'PROC-009',
      name: 'Cek Kolesterol Total (Strip)',
      category: 'Laboratorium Rapid',
      description: 'Pemeriksaan skrining lipid kolesterol kapiler cepat.',
      price: 35000,
      status: 'active',
    },
    {
      id: '25000000-0000-4000-8000-000000000010',
      code: 'PROC-010',
      name: 'Pemeriksaan Rekam Jantung (EKG)',
      category: 'Tindakan Medis',
      description: 'Perekaman aktivitas listrik jantung 12-lead lengkap dengan interpretasi.',
      price: 100000,
      status: 'active',
    },
  ];

  for (const proc of procedures) {
    await prisma.procedure.upsert({
      where: { code: proc.code },
      update: {},
      create: {
        ...proc,
        hospitalId: hospital.id,
      },
    });
  }

  // 13. Medical Certificates (SKD / Surat Sehat)
  const certificates = [
    {
      id: '68000000-0000-4000-8000-000000000001',
      certificateNumber: 'SKD/2026/08/001',
      type: 'sick_leave',
      hospitalId: hospital.id,
      encounterId: '60000000-0000-4000-8000-000000000001',
      patientId: '40000000-0000-4000-8000-000000000001',
      doctorId: '30000000-0000-4000-8000-000000000001',
      diagnosis: 'Hipertensi Primer & Kelelahan Fisik Akut',
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 86400000),
      durationDays: 2,
      notes: 'Pasien memerlukan istirahat tirah baring selama 2 hari untuk stabilisasi tekanan darah.',
      status: 'issued',
    },
  ];

  for (const cert of certificates) {
    await prisma.medicalCertificate.upsert({
      where: { certificateNumber: cert.certificateNumber },
      update: {},
      create: cert,
    });
  }

  console.log('✅ Comprehensive SehatKu HMS Database Seeding (Standard UUID v4) Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
