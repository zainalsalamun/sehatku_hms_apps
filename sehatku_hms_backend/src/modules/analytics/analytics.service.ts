import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyClinicReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Invoices today
    const invoices = await this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const paidInvoices = invoices.filter((i) => i.status === 'Lunas');
    const pendingInvoices = invoices.filter((i) => i.status === 'Menunggu');

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
    const pendingRevenue = pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

    // Payment methods breakdown
    const paymentMethodsMap: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const method = inv.paymentMethod || 'Tunai';
      paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + Number(inv.amount);
    }

    const paymentMethods = Object.keys(paymentMethodsMap).map((method) => ({
      method,
      totalAmount: paymentMethodsMap[method],
      percentage: totalRevenue > 0 ? Math.round((paymentMethodsMap[method] / totalRevenue) * 100) : 0,
    }));

    // 2. Patient visits & appointments
    const appointments = await this.prisma.appointment.findMany();
    const completedVisits = appointments.filter((a) => a.status === 'Selesai').length;
    const activeWaiting = appointments.filter((a) => a.status === 'Checked-in' || a.status === 'Menunggu').length;

    // 3. Top prescribed medicines
    const prescriptionItems = await this.prisma.prescriptionItem.findMany();
    const medicineCounts: Record<string, { count: number; dosage: string }> = {};
    for (const item of prescriptionItems) {
      if (!medicineCounts[item.medicineName]) {
        medicineCounts[item.medicineName] = { count: 0, dosage: item.dosage };
      }
      medicineCounts[item.medicineName].count += 1;
    }

    const topMedicines = Object.keys(medicineCounts)
      .map((name) => ({
        name,
        dosage: medicineCounts[name].dosage,
        prescribedCount: medicineCounts[name].count,
      }))
      .sort((a, b) => b.prescribedCount - a.prescribedCount)
      .slice(0, 5);

    // 4. Procedures catalog
    const procedures = await this.prisma.procedure.findMany({
      where: { status: 'active' },
      take: 5,
    });

    return {
      reportDate: new Date().toISOString(),
      financials: {
        totalRevenue,
        pendingRevenue,
        paidTransactionsCount: paidInvoices.length,
        pendingTransactionsCount: pendingInvoices.length,
        averageTicketSize: paidInvoices.length > 0 ? Math.round(totalRevenue / paidInvoices.length) : 0,
        paymentMethods,
      },
      operations: {
        totalAppointments: appointments.length,
        completedVisits,
        activeWaiting,
      },
      topMedicines,
      topProcedures: procedures.map((p) => ({
        code: p.code,
        name: p.name,
        category: p.category,
        price: Number(p.price),
      })),
    };
  }
}
