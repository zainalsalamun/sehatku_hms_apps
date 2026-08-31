import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, PayInvoiceDto } from './dto/billing.dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // Helper untuk mengubah angka nominal menjadi format terbilang Rupiah resmi
  private terbilangRupiah(n: number): string {
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    n = Math.floor(n);
    if (n < 12) return satuan[n];
    if (n < 20) return `${this.terbilangRupiah(n - 10)} Belas`;
    if (n < 100) return `${this.terbilangRupiah(Math.floor(n / 10))} Puluh ${this.terbilangRupiah(n % 10)}`.trim();
    if (n < 200) return `Seratus ${this.terbilangRupiah(n - 100)}`.trim();
    if (n < 1000) return `${this.terbilangRupiah(Math.floor(n / 100))} Ratus ${this.terbilangRupiah(n % 100)}`.trim();
    if (n < 2000) return `Seribu ${this.terbilangRupiah(n - 1000)}`.trim();
    if (n < 1000000) return `${this.terbilangRupiah(Math.floor(n / 1000))} Ribu ${this.terbilangRupiah(n % 1000)}`.trim();
    if (n < 1000000000) return `${this.terbilangRupiah(Math.floor(n / 1000000))} Juta ${this.terbilangRupiah(n % 1000000)}`.trim();
    return `${n} Rupiah`;
  }

  async findAll(query?: string, status?: string, patientId?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(patientId
          ? {
              OR: [
                { patientId },
                { patientName: { contains: patientId, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(query
          ? {
              OR: [
                { invoiceNumber: { contains: query, mode: 'insensitive' } },
                { patientName: { contains: query, mode: 'insensitive' } },
                { doctorName: { contains: query, mode: 'insensitive' } },
                { paymentMethod: { contains: query, mode: 'insensitive' } },
                { serviceName: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            medicalRecordNumber: true,
            insuranceProvider: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      patientId: inv.patientId,
      patientName: inv.patientName || inv.patient?.name || 'Pasien',
      patientMrn: inv.patient?.medicalRecordNumber || 'MRN-2026-001',
      insuranceProvider: inv.patient?.insuranceProvider || 'Umum / Mandiri',
      doctorName: inv.doctorName || 'dr. Maya Pratama, Sp.JP',
      serviceName: inv.serviceName || 'Pemeriksaan Klinis Rawat Jalan',
      amount: Number(inv.amount),
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
    }));
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        patient: true,
        appointment: {
          include: {
            encounters: {
              include: {
                prescriptions: {
                  include: { items: true },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice dengan ID ${id} tidak ditemukan`);
    }

    // Auto-aggregate line items
    const amountNum = Number(invoice.amount);
    const adminFee = 15000;
    const consultationFee = Math.max(0, amountNum - adminFee);

    const items = [
      {
        name: `Jasa Konsultasi & Pemeriksaan (${invoice.doctorName})`,
        category: 'Konsultasi Medis',
        quantity: 1,
        unitPrice: consultationFee,
        subtotal: consultationFee,
      },
      {
        name: 'Administrasi Rekam Medis & Pendaftaran RS',
        category: 'Administrasi',
        quantity: 1,
        unitPrice: adminFee,
        subtotal: adminFee,
      },
    ];

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      patientMrn: invoice.patient?.medicalRecordNumber || 'MRN-2026-001',
      insuranceProvider: invoice.patient?.insuranceProvider || 'Umum / Mandiri',
      doctorName: invoice.doctorName,
      serviceName: invoice.serviceName,
      amount: amountNum,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      items,
      terbilang: `${this.terbilangRupiah(amountNum)} Rupiah`,
    };
  }

  async create(dto: CreateInvoiceDto, hospitalId = '00000001-0000-4000-8000-000000000001') {
    let targetHospitalId = hospitalId;
    if (targetHospitalId === 'hosp-001' || !targetHospitalId) {
      const hosp = await this.prisma.hospital.findFirst();
      targetHospitalId = hosp?.id || '00000001-0000-4000-8000-000000000001';
    }

    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 101).toString().padStart(3, '0')}`;

    // Verify patient
    let patientId = dto.patientId;
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [{ id: patientId }, { name: { contains: patientId, mode: 'insensitive' } }],
      },
    });
    if (patient) patientId = patient.id;
    else {
      const firstPatient = await this.prisma.patient.findFirst();
      if (firstPatient) patientId = firstPatient.id;
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        id: dto.id || undefined,
        invoiceNumber,
        hospitalId: targetHospitalId,
        patientId,
        appointmentId: dto.appointmentId,
        patientName: dto.patientName,
        doctorName: dto.doctorName,
        serviceName: dto.serviceName,
        amount: dto.amount,
        status: dto.status || 'Menunggu',
        paymentMethod: dto.paymentMethod || 'Tunai',
        paidAt: dto.status === 'Lunas' ? new Date() : null,
      },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        actorName: 'Kasir Utama RS',
        actorRole: 'hospital_admin',
        action: 'CREATE',
        resourceType: 'Invoice',
        resourceId: invoice.id,
        details: `Terbit tagihan baru ${invoice.invoiceNumber} untuk ${invoice.patientName} sebesar Rp ${Number(invoice.amount).toLocaleString('id-ID')}`,
      },
    });

    return invoice;
  }

  async payInvoice(id: string, dto: PayInvoiceDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice dengan ID ${id} tidak ditemukan`);
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'Lunas',
        paymentMethod: dto.paymentMethod || invoice.paymentMethod,
        paidAt: new Date(),
      },
      include: { patient: true },
    });

    // Auto-trigger notifications
    try {
      await this.prisma.notification.createMany({
        data: [
          {
            role: 'patient',
            title: 'Pembayaran Lunas & Kwitansi Terbit',
            message: `Tagihan ${updated.invoiceNumber} sebesar Rp ${Number(updated.amount).toLocaleString('id-ID')} via ${updated.paymentMethod} telah lunas. Kwitansi resmi siap diunduh.`,
            type: 'billing',
            targetId: updated.id,
            isRead: false,
          },
          {
            role: 'admin',
            title: 'Kasir POS: Pembayaran Selesai',
            message: `Pelunasan tagihan ${updated.invoiceNumber} atas nama ${updated.patientName} via ${updated.paymentMethod} sebesar Rp ${Number(updated.amount).toLocaleString('id-ID')} berhasil dicatat.`,
            type: 'billing',
            targetId: updated.id,
            isRead: false,
          },
        ],
      });
    } catch (e) {}

    // Log to Audit Trail
    await this.prisma.auditLog.create({
      data: {
        actorName: dto.cashierName || 'Kasir Rumah Sakit',
        actorRole: 'hospital_admin',
        action: 'PAYMENT_SETTLE',
        resourceType: 'Invoice',
        resourceId: updated.id,
        details: `Pelunasan kasir POS tagihan ${updated.invoiceNumber} (${updated.patientName}) via ${updated.paymentMethod} sebesar Rp ${Number(updated.amount).toLocaleString('id-ID')}`,
      },
    });

    return {
      success: true,
      message: `Tagihan ${updated.invoiceNumber} berhasil dilunasi. Kwitansi resmi telah diterbitkan.`,
      invoice: updated,
    };
  }

  async getReceiptData(id: string) {
    const detail = await this.findOne(id);

    return {
      hospital: {
        name: 'RUMAH SAKIT SEHATKU MEDICAL CENTER',
        tagline: 'Layanan Kesehatan Paripurna & Terakreditasi Paripurna KARS',
        address: 'Jl. Sudirman Boulevard No. 45, Kebayoran Baru, Jakarta Selatan',
        phone: '(021) 555-8900 / 0812-3456-7890',
        license: 'Izin Operasional RS: No. 445/RS-DKI/2022',
        npwp: '01.234.567.8-012.000',
      },
      receipt: {
        receiptNumber: `KWIT/${detail.invoiceNumber.replace('INV-', '')}`,
        invoiceNumber: detail.invoiceNumber,
        transactionDate: detail.paidAt || detail.createdAt,
        patientName: detail.patientName,
        patientMrn: detail.patientMrn,
        insuranceProvider: detail.insuranceProvider,
        doctorName: detail.doctorName,
        serviceName: detail.serviceName,
        paymentMethod: detail.paymentMethod,
        status: detail.status,
        statusLabel: detail.status === 'Lunas' ? 'LUNAS / PAID' : 'MENUNGGU PEMBAYARAN',
        items: detail.items,
        subtotal: detail.amount,
        discount: 0,
        tax: 0,
        grandTotal: detail.amount,
        terbilang: detail.terbilang,
        verificationQrUrl: `https://sehatku.id/verify-receipt/${detail.invoiceNumber}`,
        cashierSignName: 'Siti Rahma, S.E. (Kasir RS)',
      },
    };
  }

  // ===================== CASHIER SHIFT MANAGEMENT =====================

  async openShift(dto: {
    cashierId: string;
    cashierName: string;
    shiftName?: string;
    initialCash?: number;
    notes?: string;
  }) {
    const defaultHospital = await this.prisma.hospital.findFirst();
    const hospitalId = defaultHospital?.id || 'hosp-001';

    // Check if there is already an OPEN shift for this cashier
    const existingOpen = await this.prisma.cashierShift.findFirst({
      where: {
        hospitalId,
        cashierId: dto.cashierId,
        status: 'OPEN',
      },
      orderBy: { startTime: 'desc' },
    });

    if (existingOpen) {
      return {
        success: true,
        message: `Shift ${existingOpen.shiftName} sudah aktif untuk kasir ${dto.cashierName}.`,
        shift: existingOpen,
      };
    }

    const shift = await this.prisma.cashierShift.create({
      data: {
        hospitalId,
        cashierId: dto.cashierId,
        cashierName: dto.cashierName,
        shiftName: dto.shiftName || 'Pagi',
        initialCash: dto.initialCash || 0,
        status: 'OPEN',
        notes: dto.notes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorName: dto.cashierName,
        actorRole: 'hospital_admin',
        action: 'SHIFT_OPEN',
        resourceType: 'CashierShift',
        resourceId: shift.id,
        details: `Buka shift ${shift.shiftName} kasir ${dto.cashierName} dengan kas awal Rp ${Number(shift.initialCash).toLocaleString('id-ID')}`,
      },
    });

    return {
      success: true,
      message: `Shift ${shift.shiftName} berhasil dibuka dengan kas awal Rp ${Number(shift.initialCash).toLocaleString('id-ID')}.`,
      shift,
    };
  }

  async getCurrentShift(cashierId?: string) {
    const defaultHospital = await this.prisma.hospital.findFirst();
    const hospitalId = defaultHospital?.id || 'hosp-001';

    const where: any = { hospitalId, status: 'OPEN' };
    if (cashierId) {
      where.cashierId = cashierId;
    }

    const shift = await this.prisma.cashierShift.findFirst({
      where,
      orderBy: { startTime: 'desc' },
    });

    if (!shift) {
      return null;
    }

    // Compute live transactions since shift started
    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        hospitalId,
        status: 'Lunas',
        paidAt: { gte: shift.startTime },
      },
    });

    let totalCash = 0;
    let totalQris = 0;
    let totalTransfer = 0;
    let totalDebit = 0;

    for (const inv of paidInvoices) {
      const amt = Number(inv.amount) || 0;
      const method = (inv.paymentMethod || '').toLowerCase();
      if (method.includes('tunai') || method.includes('cash')) {
        totalCash += amt;
      } else if (method.includes('qris')) {
        totalQris += amt;
      } else if (method.includes('transfer') || method.includes('bank')) {
        totalTransfer += amt;
      } else {
        totalDebit += amt;
      }
    }

    const initialCash = Number(shift.initialCash) || 0;
    const expectedCash = initialCash + totalCash;
    const grandTotalSales = totalCash + totalQris + totalTransfer + totalDebit;

    return {
      ...shift,
      liveSummary: {
        initialCash,
        totalCashReceived: totalCash,
        totalQrisReceived: totalQris,
        totalTransferReceived: totalTransfer,
        totalDebitReceived: totalDebit,
        grandTotalSales,
        totalTransactions: paidInvoices.length,
        expectedCashEnd: expectedCash,
      },
    };
  }

  async closeShift(id: string, dto: { actualCashCounted: number; notes?: string }) {
    const shift = await this.prisma.cashierShift.findUnique({
      where: { id },
    });

    if (!shift) {
      throw new NotFoundException(`Shift dengan ID ${id} tidak ditemukan`);
    }

    if (shift.status === 'CLOSED') {
      return {
        success: true,
        message: 'Shift ini sudah ditutup sebelumnya.',
        shift,
      };
    }

    const endTime = new Date();
    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        hospitalId: shift.hospitalId,
        status: 'Lunas',
        paidAt: { gte: shift.startTime, lte: endTime },
      },
    });

    let totalCash = 0;
    let totalQris = 0;
    let totalTransfer = 0;
    let totalDebit = 0;

    for (const inv of paidInvoices) {
      const amt = Number(inv.amount) || 0;
      const method = (inv.paymentMethod || '').toLowerCase();
      if (method.includes('tunai') || method.includes('cash')) {
        totalCash += amt;
      } else if (method.includes('qris')) {
        totalQris += amt;
      } else if (method.includes('transfer') || method.includes('bank')) {
        totalTransfer += amt;
      } else {
        totalDebit += amt;
      }
    }

    const initialCash = Number(shift.initialCash) || 0;
    const expectedCash = initialCash + totalCash;
    const actualCash = Number(dto.actualCashCounted) || 0;
    const discrepancy = actualCash - expectedCash;

    const closed = await this.prisma.cashierShift.update({
      where: { id },
      data: {
        status: 'CLOSED',
        endTime,
        totalCashReceived: totalCash,
        totalQrisReceived: totalQris,
        totalTransferReceived: totalTransfer,
        totalDebitReceived: totalDebit,
        totalTransactions: paidInvoices.length,
        expectedCashEnd: expectedCash,
        actualCashCounted: actualCash,
        discrepancy,
        notes: dto.notes || shift.notes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorName: shift.cashierName,
        actorRole: 'hospital_admin',
        action: 'SHIFT_CLOSE',
        resourceType: 'CashierShift',
        resourceId: closed.id,
        details: `Tutup shift ${closed.shiftName} kasir ${closed.cashierName}. Total Kas Fisik: Rp ${actualCash.toLocaleString('id-ID')}, Selisih: Rp ${discrepancy.toLocaleString('id-ID')}`,
      },
    });

    return {
      success: true,
      message: `Shift ${closed.shiftName} berhasil ditutup. Rekap serah terima kasir siap dicetak.`,
      shift: closed,
    };
  }

  async findAllShifts() {
    const shifts = await this.prisma.cashierShift.findMany({
      orderBy: { startTime: 'desc' },
      take: 50,
    });
    return shifts;
  }
}

