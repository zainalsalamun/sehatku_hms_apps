import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CollectLabSampleDto,
  CreateLabOrderDto,
  CreateLabTestCatalogDto,
  SubmitLabResultsDto,
  VerifyLabOrderDto,
} from './dto/laboratory.dto';

@Injectable()
export class LaboratoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================== CATALOG MANAGEMENT & SEEDING =====================

  async getCatalog(category?: string, query?: string) {
    const hospital = await this.prisma.hospital.findFirst();
    if (!hospital) return [];

    await this.seedDefaultCatalogsIfEmpty(hospital.id);

    return this.prisma.labTestCatalog.findMany({
      where: {
        hospitalId: hospital.id,
        status: 'active',
        ...(category && category !== 'all' ? { category } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { code: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async createCatalog(dto: CreateLabTestCatalogDto) {
    const hospital = await this.prisma.hospital.findFirst();
    if (!hospital) throw new NotFoundException('Hospital not found');

    return this.prisma.labTestCatalog.create({
      data: {
        hospitalId: hospital.id,
        code: dto.code,
        name: dto.name,
        category: dto.category,
        sampleType: dto.sampleType || 'Darah Vena',
        unit: dto.unit,
        normalRangeMin: dto.normalRangeMin,
        normalRangeMax: dto.normalRangeMax,
        normalRangeText: dto.normalRangeText,
        price: dto.price,
        description: dto.description,
        status: 'active',
      },
    });
  }

  async seedDefaultCatalogsIfEmpty(hospitalId: string) {
    const count = await this.prisma.labTestCatalog.count({
      where: { hospitalId },
    });
    if (count > 0) return;

    const defaultCatalogs = [
      // Hematologi
      {
        code: 'LAB-DL',
        name: 'Darah Lengkap (Hematologi Rutin 5-Diff)',
        category: 'Hematologi',
        sampleType: 'Darah Vena (EDTA)',
        unit: 'Panel',
        normalRangeText: 'Hb: 12-16 g/dL, Leukosit: 4.0-10.0 x10^3/uL, Trombosit: 150-450 x10^3/uL, Ht: 37-48%',
        price: 95000,
        description: 'Pemeriksaan lengkap Hemoglobin, Leukosit, Eritrosit, Trombosit, Hematokrit & Indeks Eritrosit (MCV, MCH, MCHC)',
      },
      {
        code: 'LAB-HB',
        name: 'Hemoglobin (Hb Sahli / Cyanmet)',
        category: 'Hematologi',
        sampleType: 'Darah Kapiler / Vena',
        unit: 'g/dL',
        normalRangeMin: 12.0,
        normalRangeMax: 16.5,
        normalRangeText: '12.0 - 16.5 g/dL (L: 13.5-17.5, P: 12.0-15.5)',
        price: 35000,
        description: 'Kadar pigmen pembawa oksigen darah merah',
      },
      {
        code: 'LAB-TROMBO',
        name: 'Trombosit (Platelet Count)',
        category: 'Hematologi',
        sampleType: 'Darah Vena (EDTA)',
        unit: 'x10^3/uL',
        normalRangeMin: 150,
        normalRangeMax: 450,
        normalRangeText: '150 - 450 x10^3/uL',
        price: 35000,
        description: 'Jumlah keping darah untuk evaluasi DHF, ITP, atau perdarahan',
      },
      {
        code: 'LAB-LED',
        name: 'Laju Endap Darah (LED / ESR)',
        category: 'Hematologi',
        sampleType: 'Darah Vena (Citrate)',
        unit: 'mm/jam',
        normalRangeMin: 0,
        normalRangeMax: 20,
        normalRangeText: 'L: 0 - 15 mm/jam, P: 0 - 20 mm/jam',
        price: 40000,
        description: 'Indikator inflamasi dan infeksi kronik',
      },

      // Kimia Klinik
      {
        code: 'LAB-GDS',
        name: 'Glukosa Darah Sewaktu (GDS)',
        category: 'Kimia Klinik',
        sampleType: 'Darah Vena / Kapiler',
        unit: 'mg/dL',
        normalRangeMin: 70,
        normalRangeMax: 140,
        normalRangeText: '< 140 mg/dL (Normal), 140-199 mg/dL (Pre-DM), >= 200 mg/dL (DM)',
        price: 40000,
        description: 'Skrining kadar gula darah tanpa persiapan puasa',
      },
      {
        code: 'LAB-GDP',
        name: 'Glukosa Darah Puasa (GDP)',
        category: 'Kimia Klinik',
        sampleType: 'Darah Vena (Fluoride)',
        unit: 'mg/dL',
        normalRangeMin: 70,
        normalRangeMax: 100,
        normalRangeText: '70 - 99 mg/dL (Normal)',
        price: 45000,
        description: 'Kadar gula darah setelah puasa 8-10 jam',
      },
      {
        code: 'LAB-HBA1C',
        name: 'HbA1c (Glycated Hemoglobin)',
        category: 'Kimia Klinik',
        sampleType: 'Darah Vena (EDTA)',
        unit: '%',
        normalRangeMin: 4.0,
        normalRangeMax: 5.6,
        normalRangeText: '< 5.7% (Normal), 5.7-6.4% (Pre-DM), >= 6.5% (DM)',
        price: 185000,
        description: 'Rata-rata kadar glukosa darah 2-3 bulan terakhir',
      },
      {
        code: 'LAB-KOLESTEROL',
        name: 'Kolesterol Total',
        category: 'Kimia Klinik',
        sampleType: 'Serum Darah',
        unit: 'mg/dL',
        normalRangeMin: 0,
        normalRangeMax: 200,
        normalRangeText: '< 200 mg/dL (Normal), 200-239 mg/dL (Batas Tinggi), >= 240 mg/dL (Tinggi)',
        price: 55000,
        description: 'Pemeriksaan profil risiko penyakit kardiovaskular',
      },
      {
        code: 'LAB-ASAMURAT',
        name: 'Asam Urat (Uric Acid)',
        category: 'Kimia Klinik',
        sampleType: 'Serum Darah',
        unit: 'mg/dL',
        normalRangeMin: 3.4,
        normalRangeMax: 7.0,
        normalRangeText: 'L: 3.4 - 7.0 mg/dL, P: 2.4 - 6.0 mg/dL',
        price: 45000,
        description: 'Skrining penyakit pirai (Gout Arthritis) dan fungsi metabolisme purin',
      },
      {
        code: 'LAB-SGOT',
        name: 'SGOT / AST (Fungsi Hati)',
        category: 'Kimia Klinik',
        sampleType: 'Serum Darah',
        unit: 'U/L',
        normalRangeMin: 0,
        normalRangeMax: 35,
        normalRangeText: '< 35 U/L (L: 0-35, P: 0-31)',
        price: 50000,
        description: 'Enzim penanda kerusakan sel hati dan jantung',
      },
      {
        code: 'LAB-SGPT',
        name: 'SGPT / ALT (Fungsi Hati)',
        category: 'Kimia Klinik',
        sampleType: 'Serum Darah',
        unit: 'U/L',
        normalRangeMin: 0,
        normalRangeMax: 45,
        normalRangeText: '< 45 U/L (L: 0-45, P: 0-34)',
        price: 50000,
        description: 'Enzim spesifik integritas hepatosit organ hati',
      },
      {
        code: 'LAB-KREATININ',
        name: 'Kreatinin & Ureum (Fungsi Ginjal)',
        category: 'Kimia Klinik',
        sampleType: 'Serum Darah',
        unit: 'mg/dL',
        normalRangeMin: 0.6,
        normalRangeMax: 1.2,
        normalRangeText: 'Kreatinin: 0.6 - 1.2 mg/dL, Ureum: 10 - 50 mg/dL',
        price: 85000,
        description: 'Evaluasi laju filtrasi glomerulus (eGFR) dan fungsi ginjal',
      },

      // Urinalisis
      {
        code: 'LAB-URINE',
        name: 'Urin Lengkap (Urinalisis Rutin & Sedimen)',
        category: 'Urinalisis',
        sampleType: 'Urine Pagi / Porsi Tengah',
        unit: 'Panel',
        normalRangeText: 'Warna: Kuning Jernih, pH: 4.8 - 7.5, Protein: Negatif, Glukosa: Negatif, Leukosit: 0-2 /LPB, Eritrosit: 0-1 /LPB',
        price: 65000,
        description: 'Pemeriksaan makroskopis, kimia celup strip, dan mikroskopis sedimen urine',
      },

      // Imunologi & Serologi
      {
        code: 'LAB-DENGUE-NS1',
        name: 'Dengue NS1 Antigen (Cepat Demam Hari 1-3)',
        category: 'Imunologi & Serologi',
        sampleType: 'Serum / Darah Utuh',
        unit: 'Kualitatif',
        normalRangeText: 'Negatif / Non-Reaktif',
        price: 195000,
        description: 'Deteksi dini antigen virus dengue pada fase demam akut',
      },
      {
        code: 'LAB-WIDAL',
        name: 'Uji Widal (Tifoid Salmonella)',
        category: 'Imunologi & Serologi',
        sampleType: 'Serum Darah',
        unit: 'Titer',
        normalRangeText: 'Titer O & H < 1/160 (Negatif)',
        price: 80000,
        description: 'Uji aglutinasi antibodi Salmonella typhi & paratyphi',
      },
      {
        code: 'LAB-GOLDA',
        name: 'Golongan Darah & Faktor Rhesus',
        category: 'Imunologi & Serologi',
        sampleType: 'Darah Kapiler / EDTA',
        unit: 'Tipe',
        normalRangeText: 'ABO: A / B / AB / O, Rh: Positif (+)',
        price: 35000,
        description: 'Penetapan tipe golongan darah dan rhesus transfusi',
      },

      // Radiologi
      {
        code: 'RAD-THORAX',
        name: 'Rontgen Thorax AP/PA (Foto Dada)',
        category: 'Radiologi',
        sampleType: 'Pemeriksaan Radiografi',
        unit: 'Ekspertise',
        normalRangeText: 'Cor & Pulmo dalam batas normal, CTR < 50%, sinus & diafragma tajam',
        price: 165000,
        description: 'Pemeriksaan sinar-X radiologi dada untuk jantung dan paru',
      },
      {
        code: 'RAD-USG',
        name: 'USG Abdomen 2D (Ultrasonografi Perut)',
        category: 'Radiologi',
        sampleType: 'Pemeriksaan Gelombang Suara',
        unit: 'Ekspertise',
        normalRangeText: 'Hepar, Gallbladder, Pankreas, Lien, Ginjal D/S normal',
        price: 275000,
        description: 'Pencitraan diagnostik organ abdomen non-invasif',
      },
    ];

    for (const cat of defaultCatalogs) {
      await this.prisma.labTestCatalog.create({
        data: {
          hospitalId,
          code: cat.code,
          name: cat.name,
          category: cat.category,
          sampleType: cat.sampleType,
          unit: cat.unit,
          normalRangeMin: (cat as any).normalRangeMin || null,
          normalRangeMax: (cat as any).normalRangeMax || null,
          normalRangeText: cat.normalRangeText,
          price: cat.price,
          description: cat.description,
          status: 'active',
        },
      });
    }
  }

  // ===================== LAB ORDERS MANAGEMENT =====================

  async getOrders(status?: string, priority?: string, query?: string) {
    const hospital = await this.prisma.hospital.findFirst();
    if (!hospital) return [];

    const orders = await this.prisma.labOrder.findMany({
      where: {
        hospitalId: hospital.id,
        ...(status && status !== 'all' ? { status } : {}),
        ...(priority && priority !== 'all' ? { priority } : {}),
        ...(query
          ? {
              OR: [
                { orderNumber: { contains: query, mode: 'insensitive' } },
                { patient: { name: { contains: query, mode: 'insensitive' } } },
                { patient: { medicalRecordNumber: { contains: query, mode: 'insensitive' } } },
                { doctor: { name: { contains: query, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        patient: true,
        doctor: true,
        items: {
          include: {
            testCatalog: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // CITO first
        { createdAt: 'desc' },
      ],
    });

    return orders.map((o) => this.mapOrderResponse(o));
  }

  async getOrderDetail(id: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        items: {
          include: {
            testCatalog: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Lab order not found');
    return this.mapOrderResponse(order);
  }

  async createOrder(dto: CreateLabOrderDto) {
    const hospital = await this.prisma.hospital.findFirst();
    if (!hospital) throw new NotFoundException('Hospital not found');

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Pemeriksaan lab harus memiliki minimal 1 item tes.');
    }

    // Generate Order Number
    const count = await this.prisma.labOrder.count();
    const year = new Date().getFullYear();
    const orderNumber = `LAB-${year}-${(count + 1).toString().padStart(3, '0')}`;

    // Calculate total cost
    const totalCost = dto.items.reduce((sum, item) => sum + Number(item.price), 0);

    const order = await this.prisma.labOrder.create({
      data: {
        orderNumber,
        hospitalId: hospital.id,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId || null,
        admissionId: dto.admissionId || null,
        priority: dto.priority || 'Normal',
        clinicalDiagnosis: dto.clinicalDiagnosis || null,
        clinicalNotes: dto.clinicalNotes || null,
        status: 'ordered',
        totalCost,
        items: {
          create: dto.items.map((item) => ({
            testCatalogId: item.testCatalogId || null,
            testCode: item.testCode,
            testName: item.testName,
            category: item.category,
            price: item.price,
            unit: item.unit || null,
            normalRangeText: item.normalRangeText || null,
            status: 'pending',
          })),
        },
      },
      include: {
        patient: true,
        doctor: true,
        items: {
          include: { testCatalog: true },
        },
      },
    });

    // Auto-create / append to Billing Invoice if appointmentId is present
    if (dto.appointmentId) {
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: { appointmentId: dto.appointmentId },
      });

      if (existingInvoice) {
        const newTotal = Number(existingInvoice.amount) + totalCost;
        await this.prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: { amount: newTotal },
        });
      }
    }

    return this.mapOrderResponse(order);
  }

  async collectSample(id: string, dto: CollectLabSampleDto) {
    const order = await this.prisma.labOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Lab order not found');

    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: {
        status: 'sample_collected',
        sampleCollectedAt: new Date(),
        sampleCollectorName: dto.collectorName,
      },
      include: {
        patient: true,
        doctor: true,
        items: true,
      },
    });

    return this.mapOrderResponse(updated);
  }

  async submitResults(id: string, dto: SubmitLabResultsDto) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: { items: { include: { testCatalog: true } } },
    });
    if (!order) throw new NotFoundException('Lab order not found');

    for (const res of dto.results) {
      const item = order.items.find((i) => i.id === res.itemId);
      if (item) {
        let flag = res.flag;
        // Auto-evaluate flag if not provided
        if (!flag && item.testCatalog && item.testCatalog.normalRangeMin && item.testCatalog.normalRangeMax) {
          const num = parseFloat(res.resultValue);
          if (!isNaN(num)) {
            if (num < Number(item.testCatalog.normalRangeMin)) {
              flag = 'low';
            } else if (num > Number(item.testCatalog.normalRangeMax)) {
              flag = 'high';
            } else {
              flag = 'normal';
            }
          }
        }

        await this.prisma.labOrderItem.update({
          where: { id: res.itemId },
          data: {
            resultValue: res.resultValue,
            flag: flag || 'normal',
            analystNotes: res.analystNotes || null,
            status: 'completed',
            analyzedAt: new Date(),
            analyzedBy: res.analyzedBy,
          },
        });
      }
    }

    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: { status: 'in_progress' },
      include: {
        patient: true,
        doctor: true,
        items: { include: { testCatalog: true } },
      },
    });

    return this.mapOrderResponse(updated);
  }

  async verifyOrder(id: string, dto: VerifyLabOrderDto) {
    const order = await this.prisma.labOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Lab order not found');

    const updated = await this.prisma.labOrder.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        verifiedBy: dto.verifiedBy,
      },
      include: {
        patient: true,
        doctor: true,
        items: { include: { testCatalog: true } },
      },
    });

    return this.mapOrderResponse(updated);
  }

  async getPdfData(id: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: {
        hospital: true,
        patient: true,
        doctor: true,
        items: { include: { testCatalog: true } },
      },
    });
    if (!order) throw new NotFoundException('Lab order not found');

    return {
      orderNumber: order.orderNumber,
      hospital: {
        name: order.hospital.name,
        address: order.hospital.address,
        phone: order.hospital.phone,
      },
      patient: {
        name: order.patient.name,
        medicalRecordNumber: order.patient.medicalRecordNumber,
        gender: order.patient.gender,
        birthDate: order.patient.birthDate,
        insurance: order.patient.insuranceProvider || 'Umum / Pribadi',
      },
      doctor: {
        name: order.doctor.name,
        specialist: order.doctor.specialist,
      },
      orderDate: order.createdAt,
      sampleCollectedAt: order.sampleCollectedAt,
      completedAt: order.completedAt || new Date(),
      verifiedBy: order.verifiedBy || 'dr. Hendra Gunawan, Sp.PK',
      clinicalDiagnosis: order.clinicalDiagnosis || '-',
      items: order.items.map((i) => ({
        testCode: i.testCode,
        testName: i.testName,
        category: i.category,
        resultValue: i.resultValue || '-',
        unit: i.unit || '-',
        normalRangeText: i.normalRangeText || i.testCatalog?.normalRangeText || '-',
        flag: i.flag || 'normal',
        analystNotes: i.analystNotes,
        analyzedBy: i.analyzedBy,
      })),
      verificationHash: `SEHATKU-LAB-${order.orderNumber}-${new Date().getTime()}`,
    };
  }

  // ===================== PRIVATE HELPERS =====================

  private mapOrderResponse(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      patientId: order.patientId,
      patientName: order.patient?.name || '-',
      patientMrn: order.patient?.medicalRecordNumber || '-',
      patientGender: order.patient?.gender || '-',
      patientInsurance: order.patient?.insuranceProvider || 'Umum',
      doctorId: order.doctorId,
      doctorName: order.doctor?.name || '-',
      doctorSpecialist: order.doctor?.specialist || 'Dokter Spesialis',
      appointmentId: order.appointmentId,
      admissionId: order.admissionId,
      priority: order.priority,
      clinicalDiagnosis: order.clinicalDiagnosis,
      clinicalNotes: order.clinicalNotes,
      status: order.status,
      sampleCollectedAt: order.sampleCollectedAt,
      sampleCollectorName: order.sampleCollectorName,
      completedAt: order.completedAt,
      verifiedBy: order.verifiedBy,
      totalCost: Number(order.totalCost),
      createdAt: order.createdAt,
      items: (order.items || []).map((i: any) => ({
        id: i.id,
        testCatalogId: i.testCatalogId,
        testCode: i.testCode,
        testName: i.testName,
        category: i.category,
        price: Number(i.price),
        resultValue: i.resultValue,
        unit: i.unit,
        normalRangeText: i.normalRangeText || i.testCatalog?.normalRangeText,
        flag: i.flag,
        status: i.status,
        analystNotes: i.analystNotes,
        analyzedAt: i.analyzedAt,
        analyzedBy: i.analyzedBy,
      })),
    };
  }
}
