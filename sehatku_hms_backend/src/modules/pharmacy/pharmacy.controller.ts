import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { PharmacyService } from './pharmacy.service';

@ApiTags('Pharmacy & Medication Dispensing')
@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Get('prescriptions')
  @ApiOperation({ summary: 'Daftar antrean resep obat pasien dari dokter' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter status (all, issued, dispensing, ready, completed)',
  })
  findAllPrescriptions(@Query('status') status?: string) {
    return this.pharmacyService.findAllPrescriptions(status);
  }

  @Patch('prescriptions/:id/status')
  @ApiOperation({ summary: 'Update status proses dispensing resep obat (dispensing, ready, completed)' })
  @ApiParam({ name: 'id', description: 'ID Prescription' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['issued', 'dispensing', 'ready', 'completed'],
          example: 'dispensing',
        },
      },
      required: ['status'],
    },
  })
  updatePrescriptionStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.pharmacyService.updatePrescriptionStatus(id, status);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Katalog stok inventori obat & tanggal kedaluwarsa' })
  @ApiQuery({ name: 'query', required: false, description: 'Pencarian nama obat atau batch' })
  getInventory(@Query('query') query?: string) {
    return this.pharmacyService.getInventory(query);
  }

  @Patch('inventory/:id/stock')
  @ApiOperation({ summary: 'Restock atau penyesuaian kuantitas obat di apotek' })
  @ApiParam({ name: 'id', description: 'ID Obat di inventori' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: { type: 'number', example: 50, description: 'Jumlah penambahan kuota stok' },
      },
      required: ['quantity'],
    },
  })
  adjustStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.pharmacyService.adjustStock(id, Number(quantity) || 0);
  }
}
