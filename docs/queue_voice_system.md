# Dokumentasi Sistem Pemanggilan Antrean Berbasis Suara (Voice Queue Announcement System)

Dokumen ini menjelaskan arsitektur teknis, metodologi pemrosesan, sumber daya audio, serta alur kerja pembentukan suara pengumuman antrean pada aplikasi SehatKu HMS.

---

## 1. Ringkasan Eksekutif

Sistem Pemanggilan Antrean Suara pada SehatKu HMS dirancang untuk memberikan informasi audio pemanggilan pasien secara otomatis, jelas, dan profesional ke seluruh ruang tunggu rumah sakit.

Fitur ini menggunakan pendekatan **Hybrid Client-Side Audio Synthesis** yang menggabungkan:
1. **Digital Signal Processing (DSP)** melalui Web Audio API untuk menghasilkan nada bel lonceng rumah sakit (*hospital chime*).
2. **Text-to-Speech (TTS)** melalui Web Speech API untuk membacakan nomor antrean, nama pasien, dan tujuan poliklinik/loket secara dinamis.

Pendekatan ini tidak memerlukan file audio MP3 eksternal dan tidak bergantung pada API cloud berbayar, sehingga menghasilkan latensi pemanggilan nol detik (*zero latency*) dan hemat penggunaan *bandwidth*.

---

## 2. Diagram Alur Sistem (Execution Flow)

```text
[1. User Trigger (Dashboard Dokter / Kasir / Farmasi / Layar TV)]
                            │
                            ▼
[2. Dart Layer - QueueVoiceService]
   ├── Parsing Fonetik Nomor Antrean (misal: "A-007" -> "A, nol nol tujuh")
   ├── Normalisasi Nama Ruangan & Penambahan Jeda Koma
   └── Penyusunan Kalimat Baku Bahasa Indonesia
                            │
                            ▼ (Dart JS Interop / WebAssembly)
[3. Browser Audio Layer - window.playHospitalChimeAndSpeak]
   │
   ├── [A. Web Audio API Engine]
   │     ├── Inisialisasi AudioContext
   │     ├── Sintesis 4 Nada Harmoni Bel (C5, E5, G5, C6)
   │     └── Pengaturan Volume Envelope (Attack & Exponential Decay)
   │
   └── [B. Web Speech API Engine (Setelah jeda bel 1.45 detik)]
         ├── Pencarian Voice Engine Bahasa Indonesia ('id-ID')
         ├── Penyesuaian Akustik (Pitch: 1.08, Rate: 0.96)
         └── Output Audio ke Speaker Monitor / TV Ruang Tunggu
```

---

## 3. Sumber Resource Suara (Audio & Voice Sources)

Sistem ini tidak mengunduh resource audio dari server eksternal, melainkan memanfaatkan kemampuan bawaan perangkat:

### A. Resource Nada Bel (Hospital Chime)
- **Sumber:** Dihitung dan disintesis langsung oleh kartu suara (*sound chip*) perangkat melalui **Web Audio API**.
- **Komposisi Nada:**
  - Nada 1: 523.25 Hz (C5)
  - Nada 2: 659.25 Hz (E5)
  - Nada 3: 783.99 Hz (G5)
  - Nada 4: 1046.50 Hz (C6)
- **Efek Akustik:** Setiap nada digabungkan dengan osilator segitiga (*harmonic overtone*) pada frekuensi ganda (`freq * 2`) untuk menghasilkan gema lonceng kristal yang elegan.

### B. Resource Suara Manusia (Text-to-Speech Engine)
- **Sumber:** Mesin *Speech Synthesis* lokal bawaan Sistem Operasi (OS) / Browser:
  - **Google Chrome / Android:** Google Bahasa Indonesia TTS Engine.
  - **Windows / Microsoft Edge:** Microsoft Natural Voice (Microsoft Gadis / Ardi).
  - **macOS / iOS / Safari:** Apple Speech Synthesis (Damayanti / Indonesian Voice).
- **Akses:** Dipanggil melalui antarmuka standar `window.speechSynthesis`.

---

## 4. Metodologi Pembentukan Suara

Proses pembentukan suara berjalan melalui 4 tahapan sistematis:

### Tahap 1: Normalisasi Teks Fonetik (Text Normalization)
Nomor antrean diurai per karakter agar mesin suara tidak salah mengucapkan singkatan atau angka besar:
- Input Mentah: `A-007`
- Hasil Konversi Fonetik: `"A, nol nol tujuh"`
- Input Mentah: `B-012`
- Hasil Konversi Fonetik: `"B, nol satu dua"`

### Tahap 2: Penyusunan Struktur Kalimat Berjeda
Kalimat disusun dengan penempatan tanda koma mikro untuk memberikan jeda nafas alami:
```text
"Panggilan nomor antrean, [Nomor Fonetik]. Atas nama, [Nama Pasien], silakan menuju ke [Ruang Tujuan]. Terima kasih."
```

### Tahap 3: Pemutaran Bel Pembuka (Chime Generation)
Sebelum pesan suara diucapkan, sistem membunyikan 4 nada bel berurutan selama 0.9 detik untuk memusatkan perhatian pengunjung ruang tunggu.

### Tahap 4: Pelafalan Suara (Speech Utterance Execution)
Tepat 1.45 detik setelah bel dimulai (saat suara bel mulai memudar), objek `SpeechSynthesisUtterance` dieksekusi dengan konfigurasi akustik:
- Bahasa: `id-ID`
- Kecepatan (`rate`): `0.96` (artikulasi jelas, tidak terburu-buru).
- Nada (`pitch`): `1.08` (ramah, formal, dan tidak monoton).
- Volume: `1.0` (maksimal).

---

## 5. Struktur Berkas & Implementasi Kode

Fitur ini diimplementasikan dalam 3 berkas utama:

### 1. `lib/core/services/queue_voice_service.dart`
Bertanggung jawab atas pemrosesan data, pemisahan fonetik angka, dan orkestrasi pemanggilan antar-modul di Flutter.

```dart
Future<void> announce({
  required String queueNumber,
  required String patientName,
  required String destination,
}) async {
  final spelledQueue = spellQueueNumber(queueNumber);
  final targetDestination = cleanDestination(destination);
  final spokenText =
      'Panggilan nomor antrean, $spelledQueue. Atas nama, $patientName, silakan menuju ke $targetDestination. Terima kasih.';

  voice_platform.playHospitalChimeAndSpeak(spokenText);
}
```

### 2. `lib/core/services/queue_voice_platform_web.dart`
Jembatan FFI / JS Interop menggunakan standar `dart:js_interop` modern:

```dart
@JS('playHospitalChimeAndSpeak')
external void _playHospitalChimeAndSpeak(JSString text);

void playHospitalChimeAndSpeak(String text) {
  _playHospitalChimeAndSpeak(text.toJS);
}
```

### 3. `web/index.html`
Script inti Web Audio API dan Web Speech API yang berjalan langsung di browser:

```javascript
window.playHospitalChimeAndSpeak = function(spokenText) {
  // 1. Generate 4-Tone Hospital Chime
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const ctx = new AudioContext();
    const t0 = ctx.currentTime + 0.05;
    playHarmonicBell(ctx, 523.25, t0 + 0.00, 0.38, 0.28); // C5
    playHarmonicBell(ctx, 659.25, t0 + 0.18, 0.38, 0.30); // E5
    playHarmonicBell(ctx, 783.99, t0 + 0.36, 0.42, 0.32); // G5
    playHarmonicBell(ctx, 1046.50, t0 + 0.54, 0.90, 0.35); // C6
  }

  // 2. Execute Speech Synthesis
  setTimeout(function() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'id-ID';
      utterance.rate = 0.96;
      utterance.pitch = 1.08;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, 1450);
};
```

---

## 6. Panduan Kustomisasi

Parameter suara dapat disesuaikan sesuai kebutuhan instansi rumah sakit:

| Parameter | Lokasi Konfigurasi | Nilai Standar | Rekomendasi Kustomisasi |
| :--- | :--- | :--- | :--- |
| **Pitch (Tinggi Nada)** | `web/index.html` | `1.08` | `0.95` (Lebih Formal) s.d. `1.15` (Lebih Ceria) |
| **Rate (Kecepatan)** | `web/index.html` | `0.96` | `0.90` (Untuk Aula Besar Berdengung) |
| **Susunan Kalimat** | `queue_voice_service.dart` | Template Baku | Dapat disesuaikan untuk Poli, Farmasi, atau Kasir |
| **Frekuensi Bel** | `web/index.html` | C5, E5, G5, C6 | Dapat diubah ke 2 nada (Ding-Dong) |

---

## 7. Keunggulan Arsitektur

1. **Zero Bandwidth & Zero File Overhead:** Tidak ada aset file rekaman suara (.mp3/.wav) yang memperberat ukuran bundle aplikasi (0 KB asset size).
2. **Tanpa Biaya API Cloud:** 100% menggunakan kapabilitas browser lokal tanpa perlu berlangganan Google Cloud TTS, AWS Polly, atau ElevenLabs.
3. **Respon Real-Time:** Eksekusi audio terjadi instan di sisi klien tanpa menunggu unduhan audio dari backend.
4. **Dukungan Multi-Platform:** Kompatibel dengan Smart TV, PC Ruang Tunggu, Tablet Petugas, maupun Web Browser.
