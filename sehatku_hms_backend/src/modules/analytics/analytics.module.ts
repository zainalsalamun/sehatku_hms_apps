import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PharmacyModule } from '../pharmacy/pharmacy.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [PrismaModule, PharmacyModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
