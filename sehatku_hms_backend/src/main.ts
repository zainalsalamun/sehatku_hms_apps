import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static assets (Doctor profile photos, avatars)
  const publicDir = join(process.cwd(), 'public');
  app.useStaticAssets(publicDir, {
    prefix: '/public',
  });

  // Robust CORS for Flutter Web & Mobile dev
  app.enableCors({
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger / OpenAPI 3.1 Setup
  const config = new DocumentBuilder()
    .setTitle('SehatKu Hospital Management System (HMS) API')
    .setDescription(
      'REST API Backend untuk Ekosistem Rumah Sakit SehatKu (Pasien, Dokter, dan Admin). Mengimplementasikan role-based access control, master data CRUD, antrean, billing, dan audit trail.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'Endpoint otentikasi JWT dan login')
    .addTag('Doctors', 'Manajemen data dokter, spesialisasi, dan jadwal praktek')
    .addTag('Patients', 'Master data pasien, No. Rekam Medis (MRN), dan asuransi')
    .addTag('Appointments', 'Booking janji temu, antrean poli, check-in, dan pembatalan')
    .addTag('Billing', 'Invoice tindakan medis dan status pelunasan kasir')
    .addTag('Audit Logs', 'Riwayat audit trail aktivitas dan mutasi data immutable')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SehatKu HMS API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 SehatKu HMS Backend running at: http://localhost:${port}/api/v1`);
  console.log(`📑 OpenAPI / Swagger Docs at: http://localhost:${port}/api/docs`);
}
bootstrap();
