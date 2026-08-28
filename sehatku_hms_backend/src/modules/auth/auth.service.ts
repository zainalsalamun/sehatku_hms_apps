import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Kombinasi email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Kombinasi email atau password salah');
    }

    const roles = user.userRoles.map((ur) => ur.role.code);

    // Fetch linked Doctor profile if role is doctor
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        OR: [{ userId: user.id }, { email: user.email }],
      },
      include: { department: true },
    });

    // Fetch linked Patient profile if role is patient
    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [{ userId: user.id }, { email: user.email }],
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      fullName: doctor?.name || patient?.name || user.fullName,
      roles,
      hospitalId: user.userRoles[0]?.hospitalId || 'hosp-001',
      doctorId: doctor?.id,
      patientId: patient?.id,
    };

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Record audit log for login
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorName: payload.fullName,
        actorRole: roles[0] || 'patient',
        action: 'LOGIN',
        resourceType: 'Session',
        resourceId: user.id,
        details: `Berhasil login ke sistem SehatKu HMS`,
      },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: payload.fullName,
        roles,
        doctor: doctor
          ? {
              id: doctor.id,
              name: doctor.name,
              specialist: doctor.specialist,
              departmentId: doctor.departmentId,
              departmentName: doctor.department?.name || 'Poliklinik',
            }
          : null,
        patient: patient
          ? {
              id: patient.id,
              name: patient.name,
              medicalRecordNumber: patient.medicalRecordNumber,
            }
          : null,
      },
    };
  }
}
