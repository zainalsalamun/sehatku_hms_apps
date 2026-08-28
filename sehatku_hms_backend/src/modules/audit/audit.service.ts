import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: string, action?: string) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(action && action !== 'all' ? { action } : {}),
        ...(query
          ? {
              OR: [
                { actorName: { contains: query, mode: 'insensitive' } },
                { details: { contains: query, mode: 'insensitive' } },
                { resourceType: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async createLog(data: {
    actorId?: string;
    actorName: string;
    actorRole: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details: string;
    ipAddress?: string;
    hospitalId?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        hospitalId: data.hospitalId || 'hosp-001',
      },
    });
  }
}
