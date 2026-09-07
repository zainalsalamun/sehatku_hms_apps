import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications (Pasien, Dokter & Admin)')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar notifikasi real-time berdasarkan peran atau user ID' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter peran target (patient, doctor, admin, all)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter ID user penerima' })
  @ApiQuery({ name: 'isRead', required: false, description: 'Filter status baca (true / false)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Batas jumlah notifikasi', example: 50 })
  findAll(
    @Query('role') role?: string,
    @Query('userId') userId?: string,
    @Query('isRead') isReadStr?: string,
    @Query('limit') limit?: string,
  ) {
    const isRead = isReadStr !== undefined ? isReadStr === 'true' : undefined;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.notificationsService.findAll(role, userId, isRead, limitNum);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Jumlah notifikasi yang belum dibaca (Unread Count Badge)' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter peran target (patient, doctor, admin, all)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter ID user penerima' })
  getUnreadCount(@Query('role') role?: string, @Query('userId') userId?: string) {
    return this.notificationsService.getUnreadCount(role, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Kirim notifikasi baru (System Event / Manual Admin Broadcast)' })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ status: 201, description: 'Notifikasi berhasil dibuat' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Tandai seluruh notifikasi telah dibaca' })
  @ApiQuery({ name: 'role', required: false, description: 'Peran target' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID user penerima' })
  markAllAsRead(@Query('role') role?: string, @Query('userId') userId?: string) {
    return this.notificationsService.markAllAsRead(role, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai satu notifikasi telah dibaca' })
  @ApiParam({ name: 'id', description: 'ID Notifikasi' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus notifikasi' })
  @ApiParam({ name: 'id', description: 'ID Notifikasi' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
