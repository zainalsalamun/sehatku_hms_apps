import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string, userId?: string, isRead?: boolean, limit = 50) {
    return this.prisma.notification.findMany({
      where: {
        ...(role && role !== 'all'
          ? {
              OR: [{ role }, { role: 'all' }],
            }
          : {}),
        ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
        ...(isRead !== undefined ? { isRead } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(role?: string, userId?: string): Promise<{ unreadCount: number }> {
    const count = await this.prisma.notification.count({
      where: {
        isRead: false,
        ...(role && role !== 'all'
          ? {
              OR: [{ role }, { role: 'all' }],
            }
          : {}),
        ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      },
    });

    return { unreadCount: count };
  }

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId || null,
        role: dto.role || 'all',
        title: dto.title,
        message: dto.message,
        type: dto.type || 'info',
        targetId: dto.targetId || null,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) {
      throw new NotFoundException(`Notifikasi dengan ID ${id} tidak ditemukan`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(role?: string, userId?: string) {
    return this.prisma.notification.updateMany({
      where: {
        isRead: false,
        ...(role && role !== 'all'
          ? {
              OR: [{ role }, { role: 'all' }],
            }
          : {}),
        ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      },
      data: { isRead: true },
    });
  }

  async remove(id: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) {
      throw new NotFoundException(`Notifikasi dengan ID ${id} tidak ditemukan`);
    }

    return this.prisma.notification.delete({ where: { id } });
  }
}
