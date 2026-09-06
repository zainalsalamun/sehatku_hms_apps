import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(hospitalId = 'hosp-001') {
    const departments = await this.prisma.department.findMany({
      where: { hospitalId, status: 'active' },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      status: d.status,
      doctorCount: d._count.doctors,
    }));
  }

  async findOne(id: String) {
    const dept = await this.prisma.department.findUnique({
      where: { id: id as string },
      include: {
        doctors: true,
      },
    });

    if (!dept) {
      throw new NotFoundException(`Departemen dengan ID ${id} tidak ditemukan`);
    }

    return dept;
  }
}
