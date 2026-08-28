# SehatKu HMS (Hospital Management System)

Sistem Informasi Manajemen Rumah Sakit dan Klinik Pratama/Utama modern, modular, dan terpadu berbasis NestJS, Prisma ORM, PostgreSQL, dan Flutter (Mobile & Web). Sistem ini menghubungkan seluruh alur operasional medis dan administratif secara langsung ke database tanpa dummy data.

---

## 1. Gambaran Umum Arsitektur

Monorepo ini terdiri atas dua komponen utama:

```text
sehatku_hms/
├── sehatku_hms_backend/      # Backend REST API (NestJS + Prisma ORM + PostgreSQL)
├── sehatku_hms_mobile/       # Frontend Multiplatform (Flutter Web & Mobile)
├── docs/                     # Dokumentasi Arsitektur, PRD, Data Model, OpenAPI & Postman
├── database/                 # SQL Schema DDL & Database Seed Scripts
└── docker-compose.yml        # PostgreSQL 16, Redis 7, & pgAdmin 4
```

---

## 2. Fitur-Fitur Utama yang Telah Diterapkan

### A. Otentikasi dan Multi-Role (RBAC)
- Role Terintegrasi: Pasien, Dokter Spesialis, dan Hospital Admin / Kasir / Apoteker / Resepsionis.
- Token JWT & UUID v4: Standarisasi seluruh ID transaksi, pasien, dokter, dan invoice menggunakan format UUID v4 standar RFC 4122.
- Keamanan Akun: Hash password Bcrypt, RBAC Guard, dan immutable audit trail log.

### B. Suara Pemanggilan Antrean dan Layar TV Ruang Tunggu (/queue-display)
- Suara Pemanggilan Suara (Indonesian TTS): Pelafalan nomor antrean fonetik (contoh: "Nomor Antrean, A, nol nol satu, Saudara Nadia Putri, silakan menuju ke Poli Kardiologi, Ruang Periksa Dokter").
- Nada Bel Ding-Dong Rumah Sakit: Synthesizer nada 2-tone harmonis (F5 -> C5) dengan Web Audio API sebelum suara panggilan berbunyi.
- Layar TV Display Cerdas:
  - Hero Active Calling Card dengan badge panggilan langsung.
  - Jam Digital WIB real-time.
  - Sub-Counter Antrean Live (Poli Dokter, Loket Kasir, dan Loket Farmasi).
  - Teks Berjalan (Running Text Banner) pengumuman klinik.

### C. Modul Pendaftaran Reservasi dan Pasien Walk-in (Loket Admisi)
- Layar Khusus Loket (/admin/appointments/create):
  - Pasien Terdaftar: Pencarian live cepat (Nama, No. RM, NIK, Penjamin, No. HP).
  - Pasien Baru (Walk-in): Form kilat untuk pasien yang baru pertama kali datang langsung ke klinik tanpa booking online. Sistem otomatis membuatkan profil dan No. RM baru.
  - Kategori Poli dan Dokter Spesialis: Pilihan poli lengkap dengan profil dokter, pengalaman, rating, dan status kehadiran hari ini.
  - Jadwal dan Sesi Waktu: Shortcut tanggal (Hari Ini, Besok, Kalender) dan grid pilihan slot jam praktek (08:00 - 20:00 WIB).
  - Karcis Antrean Visual: Pratinjau karcis antrean langsung sebelum dicetak ke printer thermal 58mm.

### D. Rekam Medis Elektronik (EMR SOAP Dokter)
- Anamnesis dan Pemeriksaan Fisik (Subjective & Objective).
- Tanda Vital Lengkap: Tekanan darah, denyut nadi, laju nafas, suhu, SpO2, TB, BB, dan kalkulator BMI otomatis.
- Diagnosa ICD-10 Resmi Kemenkes RI.
- Input Tindakan Medis: Integrasi tarif tindakan langsung ke billing invoice kasir.
- E-Prescription: Peresepan obat otomatis ke modul farmasi.
- Penerbitan Surat Keterangan Medis (SKD): Surat Izin Sakit dan Surat Sehat dengan Kop Klinik, QR Code verifikasi digital, dan unduh PDF resmi.

### E. Modul Farmasi, Etiket Obat, dan Dispensing
- Alur Dispensing: Menunggu -> Sedang Diracik -> Siap di Loket -> Diserahkan.
- Cetak Etiket Stiker Obat (Thermal 58/80mm):
  - Etiket Obat Minum (Putih): Kop Apotek/Klinik, SIA/SIPA, No. Resep, Tgl, Nama Pasien, No. RM, Aturan Minum (Pagi-Siang-Malam, Sebelum/Sesudah Makan), Exp/BUD, dan Peringatan Antibiotik.
  - Etiket Obat Luar (Biru): Header khusus "OBAT LUAR - TIDAK BOLEH DITELAN".
- Label Stiker Rekam Medis (MRN Label): Label stiker identitas pasien untuk map berkas RM dan tabung laboratorium.
- Pemotongan Stok Otomatis: Stok obat berkurang seketika saat obat diserahkan ke pasien.

### F. Modul Kasir POS, Manajemen Shift, dan Tutup Kas Harian
- Buka Shift Kasir: Input modal kas awal / uang kembalian sebelum transaksi dimulai.
- Pelunasan Multi-Metode: Tunai, QRIS Dinamis, Transfer Bank, Kartu Debit/EDC, dan BPJS Kesehatan.
- Tutup Shift Kasir (Closing): Rekonsiliasi live seluruh penerimaan, input uang kas fisik di laci, kalkulasi selisih otomatis (Balance/Surplus/Defisit), dan cetak Lembar Serah Terima Kasir Resmi.
- Cetak Kwitansi Resmi PDF: Kwitansi resmi ber-kop klinik dengan QR Code validasi dan rincian transaksi lengkap.

### G. Laporan Keuangan dan Analisis Klinik
- Rekapitulasi Pendapatan Harian: Pendapatan lunas vs pending, rata-rata transaksi, dan persentase metode bayar.
- Analisis 5 Obat Terlaris: Grafik kuantitas resep obat yang paling sering diresepkan dokter.

### H. Modul Rawat Inap (Inpatient / Ranap) dan Manajemen Kamar / Bed
- Visual Bed Floor Plan: Monitoring denah kamar dan bed real-time (VIP, Kelas 1, 2, 3, ICU, Isolasi) dengan status Tersedia, Terisi, Sterilisasi/Cleaning, dan Maintenance.
- Indikator BOR (Bed Occupancy Rate): Perhitungan otomatis okupansi tempat tidur rumah sakit.
- Alur Admisi Pasien Ranap: Check-in pasien masuk kamar, penetapan dokter DPJP, dan alokasi bed kosong.
- Lembar CPPT Terintegrasi: Catatan Perkembangan Pasien Terintegrasi (SOAP harian visit dokter, TTV, instruksi perawat, dan terapi cairan infus/injeksi).
- Pindah Kamar (Transfer Bed): Pemindahan pasien antar kamar/kelas dengan status bed lama otomatis berganti menjadi cleaning.
- Pemulangan Pasien (Discharge) & Auto Billing: Resume medis pemulangan, kalkulasi lama hari rawat x tarif kamar, dan penerbitan invoice otomatis ke Kasir POS.

### I. Modul Laboratorium & Diagnostik Terpadu (LIS - Laboratory Information System)
- Katalog Parameter Uji: Hematologi lengkap, kimia darah, profil lipid, urinalisis, serologi, dan radiologi dengan nilai rujukan normal (Reference Range) dan satuan (Unit).
- Alur Permintaan Order Lab: Pemesanan tes langsung oleh dokter dari layar konsultasi EMR dengan prioritas Normal vs CITO.
- Lembar Kerja Analis & Flagging Otomatis: Entri nilai hasil uji laboratorium oleh analis dengan deteksi otomatis nilai kritis (Normal, Low, High, Critical).
- Validasi Penanggung Jawab Lab (Sp.PK): Verifikasi medis sebelum lembar hasil dirilis resmi.
- Cetak Lembar Hasil Lab Resmi (A4): Format cetak A4 ber-kop rumah sakit, tanda tangan dokter Sp.PK, dan QR Code verifikasi digital.
- Sinkronisasi Tagihan Kasir: Biaya pemeriksaan diagnostik otomatis masuk ke invoice Kasir POS pasien.

### J. Modul Export Laporan Keuangan, Farmasi, & Laporan LB1 Dinkes ke Excel (.csv)
- Export Laporan Kasir & Keuangan: Download rincian transaksi harian/bulanan, metode bayar (Tunai, QRIS, Transfer, Debit), status tagihan, dan rekap omzet ke format spreadsheet.
- Laporan 10 Besar Penyakit (LB1 Dinas Kesehatan): Rekapitulasi agregasi diagnosa ICD-10 dan demografi gender pasien (L/P) sesuai format standar pelaporan Dinas Kesehatan.
- Laporan Mutasi & Valuasi Stok Farmasi: Export daftar stok obat, nomor batch, minimum stok, harga pokok, harga jual, dan total nilai aset obat apotek.
- Laporan Kunjungan Pasien Poliklinik: Rekapitulasi antrean kunjungan per dokter DPJP, keluhan, dan penjamin pasien.
- Format Standar Spreadsheet: Encoding UTF-8 BOM untuk kompatibilitas langsung dengan Microsoft Excel, Google Sheets, dan LibreOffice tanpa kendala formatting.

---

## 3. Panduan Penggunaan Sistem Berdasarkan Role

### 👤 Panduan Pengguna: Pasien (Portal Pasien)
1. Login sebagai Pasien menggunakan email dan password akun terdaftar.
2. Buat Janji Temu:
   - Pilih Dokter Spesialis dan Poli yang diinginkan.
   - Tentukan tanggal dan jam sesi konsultasi.
   - Tuliskan keluhan utama, lalu selesaikan reservasi.
3. Pantau Antrean dan Riwayat:
   - Buka tab Janji Temu untuk melihat nomor antrean Anda.
   - Unduh Kwitansi Pembayaran Resmi dan Surat Keterangan Medis (SKD) jika telah diterbitkan oleh dokter.
4. Notifikasi:
   - Cek ikon lonceng untuk melihat status pemanggilan antrean, resep obat siap, dan pelunasan kasir.

---

### 👨‍⚕️ Panduan Pengguna: Dokter (Dashboard Dokter)
1. Login sebagai Dokter menggunakan akun dokter.
2. Memeriksa Antrean Pasien:
   - Pantau daftar antrean pasien hari ini pada panel antrean.
   - Klik tombol Panggil Suara untuk memanggil pasien melalui sistem suara speaker klinik dan layar TV display.
3. Melakukan Konsultasi Medis (SOAP):
   - Klik tombol Mulai Konsultasi & Rekam Medis (SOAP).
   - Isi Anamnesis (S), Tanda Vital Pasien (O), Diagnosa ICD-10 (A), Tindakan Medis, dan Resep Obat (P).
   - Terbitkan Surat Izin Sakit (SKD) atau Surat Sehat jika pasien membutuhkan.
   - Klik Simpan & Teruskan ke Farmasi / Kasir.

---

### 🏢 Panduan Pengguna: Administrator, Loket Pendaftaran, Kasir, dan Farmasi

#### 1. Loket Admisi & Pendaftaran Pasien:
- Buka tab Reservasi & Antrean.
- Klik tombol Daftar Reservasi / Walk-in di pojok kanan atas untuk membuka layar pendaftaran luas.
- Pilih Pasien Terdaftar atau ketik identitas Pasien Baru (Walk-in).
- Tentukan Poli, Dokter, Tanggal, Jam Sesi, dan Keluhan.
- Klik Daftarkan Reservasi & Terbitkan Antrean, lalu cetak karcis antrean untuk diserahkan ke pasien.

#### 2. Loket Kasir POS & Tutup Shift:
- Buka tab Kasir & Tagihan.
- Jika shift belum dibuka, klik Buka Shift Kasir POS dan masukkan modal kas awal.
- Proses pelunasan tagihan pasien dengan memilih metode bayar (Tunai, QRIS, Transfer, Debit).
- Cetak Kwitansi Resmi Pembayaran PDF untuk pasien.
- Pada akhir jam kerja, klik Tutup Shift & Rekap Kas, hitung uang fisik di laci kasir, lalu cetak Lembar Serah Terima Kasir.

#### 3. Loket Farmasi & Apotek:
- Buka tab Farmasi & Resep.
- Resep baru dari dokter akan muncul dengan status Menunggu.
- Klik Mulai Racik Obat untuk memproses sediaan.
- Klik Cetak Etiket Obat & Label RM untuk mencetak etiket putih (obat minum) atau etiket biru (obat luar).
- Klik Panggil Suara saat obat sudah siap di loket.
- Klik Serahkan ke Pasien (Selesai) untuk menyerahkan obat (stok obat otomatis terpotong).

#### 4. Layar TV Antrean Ruang Tunggu:
- Buka menu Layar TV Antrean (/queue-display) pada layar monitor atau Smart TV di ruang tunggu klinik.
- Layar akan otomatis menampilkan panggilan pasien live, waktu WIB, dan antrean berjalan di setiap loket.

#### 5. Ruang Rawat Inap & Manajemen Bed (Ranap):
- Buka tab Rawat Inap & Bed.
- Pantau indikator BOR dan denah kamar visual (warna hijau = bed kosong, biru = terisi pasien, kuning = pembersihan).
- Untuk admisi pasien baru, klik Admisi Pasien Baru (Check-In Ranap) atau klik Admisi Masuk pada bed kosong.
- Untuk mencatat visit harian dokter atau tindakan perawat, klik tombol CPPT pada kartu bed pasien.
- Untuk memindahkan pasien ke kamar/kelas lain, klik icon Pindah Kamar (Transfer Bed).
- Untuk memulangkan pasien, klik icon Pulangkan Pasien (Discharge), isi diagnosa akhir dan kondisi keluar, lalu sistem akan otomatis menghitung total hari rawat x tarif kamar dan menerbitkan invoice ke Kasir POS.

#### 6. Instalasi Laboratorium & LIS:
- Buka tab Laboratorium & LIS.
- Pantau antrean sampel baru dari poli/ranap dengan prioritas CITO dan Normal.
- Klik Tandai Sampel Diambil saat petugas telah melakukan pengambilan darah atau penampungan urin.
- Klik icon Entri Hasil (Edit) untuk memasukkan nilai hasil pengujian alat laboratorium dan memilih indikator flag (Normal, Low, High, Critical).
- Klik Verifikasi & Selesaikan Hasil untuk validasi dokter Sp.PK.
- Klik icon Cetak untuk mencetak Lembar Hasil Laboratorium format A4 resmi dengan QR Code keaslian.

#### 7. Export Laporan Excel (.csv):
- Buka tab Laporan Klinik.
- Pantau kartu 10 Besar Penyakit Terbanyak (LB1 Dinkes) dan klik tombol Export LB1 (.csv).
- Klik tombol Export Excel / CSV di pojok kanan atas untuk memilih jenis laporan lain:
  - Laporan Rekapitulasi Kasir & Keuangan
  - Laporan 10 Besar Penyakit (LB1 Dinkes)
  - Laporan Mutasi & Valuasi Stok Farmasi
  - Laporan Kunjungan Pasien Poliklinik
- Tentukan rentang periode (Hari Ini, 7 Hari Terakhir, Bulan Ini, Semua Periode).
- Klik Unduh File Excel (.csv) dan file spreadsheet akan otomatis terunduh ke perangkat Anda.

---

## 4. Cara Menjalankan Aplikasi Secara Lokal

### Prasyarat:
- Node.js >= 18.x
- Flutter SDK >= 3.22.x
- PostgreSQL 16 & Redis 7 (via Docker)

### Menjalankan Backend:
```bash
cd sehatku_hms_backend
npm install
npx prisma db push
npm run start:dev
```
Backend API akan berjalan di `http://localhost:3000` dan Swagger API Docs di `http://localhost:3000/api/docs`.

### Menjalankan Frontend (Flutter Web):
```bash
cd sehatku_hms_mobile
flutter run -d chrome
```
Aplikasi Flutter akan terbuka di browser Chrome.

---

Dokumentasi ini disusun sebagai panduan standar operasional sistem Klinik Pratama & Rumah Sakit SehatKu Medika.
