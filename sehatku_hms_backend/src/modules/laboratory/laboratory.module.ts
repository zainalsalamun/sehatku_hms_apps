import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LaboratoryController } from './laboratory.controller';
import { LaboratoryService } from './laboratory.service';

@Module({
  imports: [PrismaModule],
  controllers: [LaboratoryController],
  providers: [LaboratoryService],
  exports: [LaboratoryService],
})
export class LaboratoryModule {}
