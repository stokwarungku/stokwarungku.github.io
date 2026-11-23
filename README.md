# Stok Warung

Aplikasi kasir dan pencatatan stok untuk warung / toko kelontong.
HTML + CSS + JavaScript biasa (tanpa library, tanpa internet, tanpa instalasi). Data tersimpan di browser (localStorage).

## Cara menjalankan di Windows

**Cara 1 (paling mudah)**
1. Klik kanan file ZIP, pilih **Extract All**.
2. Buka folder hasil ekstrak, klik dua kali **index.html** (terbuka di Chrome / Edge).

**Cara 2 (lewat VS Code)**
1. Ekstrak ZIP, buka VS Code, pilih **File > Open Folder** lalu pilih folder `stok-warung`.
2. (Opsional) pasang ekstensi **Live Server**, klik kanan `index.html` lalu **Open with Live Server**.

> Penting: data tersimpan per alamat. `index.html` yang dibuka langsung (file://) dan yang dibuka lewat Live Server (http://127.0.0.1:5500) punya **penyimpanan terpisah**. Pilih satu cara dan pakai terus. Untuk pindah cara atau pindah komputer, pakai **Backup** lalu **Pulihkan**.

## Dipakai di HP

- Paling aman: pakai **stok-warung-satu-file.html**. Satu file ini sudah berisi semua tampilan, font, dan program, jadi tetap rapi walau dibuka dari aplikasi File Manager, WhatsApp, atau Google Drive.
- Jika memakai `index.html`, **index.html, style.css, fonts.css, dan script.js harus berada dalam satu folder**. Kalau salah satunya tidak ikut, tampilan jadi polos (tanpa warna/font) dan aplikasi menampilkan pesan peringatan.
- File satu-file adalah salinan gabungan. Jika kamu mengubah style.css atau script.js, gabungkan ulang atau ubah juga isi file satu-file.
- Di HP, data tersimpan terpisah dari data di laptop. Pindahkan data lewat **Backup** lalu **Pulihkan akun**.

## Pertama kali dipakai

1. Layar pertama meminta pembuatan **akun pemilik** (nama toko, nama, username, password minimal 6 karakter).
2. Menu **Barang > Tambah Barang**: isi nama, satuan dasar, satuan grosir (opsional), harga modal, harga jual, stok minimum, dan stok awal.
3. Mulai berjualan di menu **Kasir**.

Ingin mencoba dulu? Di layar masuk klik **Coba mode demo**. Mode demo memakai data contoh yang **terpisah total** dari data asli (kunci penyimpanan berbeda, backup demo tidak bisa dipulihkan ke data asli dan sebaliknya). Akun demo: `pemilik` / `pemilik123` dan `kasir` / `kasir123`.

## Sistem satuan

Setiap barang punya **satuan dasar** (pcs, sachet, botol, kg, ...) dan boleh punya **satuan grosir** dengan isi tertentu. Stok selalu disimpan dalam satuan dasar.

| Barang | Satuan dasar | Satuan grosir |
|---|---|---|
| Mie | pcs | 1 dus = 48 pcs |
| Kopi | sachet | 1 renceng = 10 sachet |
| Minuman | botol | 1 dus = 24 botol |

- Beli 2 dus mie: isi `2` di kolom **dus** pada Stok, otomatis menambah **96 pcs**.
- Jual 12 pcs mie: stok berkurang **12 pcs**. Jual 1 dus: berkurang 48 pcs.
- Nama satuan grosir dan isinya diingat (ketik "dus" langsung terisi 48). Isi bisa diubah kapan saja.
- Harga modal dan harga jual diisi per satuan dasar. Harga grosir opsional. Harga per dus dihitung otomatis.

## Menu dan hak akses

| Menu | Pemilik | Kasir |
|---|---|---|
| Dashboard (penjualan, stok menipis, grafik) | semua | tanpa keuntungan |
| Kasir (eceran dan grosir, diskon %, cetak nota) | ya | ya |
| Barang (tambah, edit, hapus/arsip) | ya | hanya lihat, tanpa harga modal |
| Stok (barang masuk dan keluar, riwayat stok) | ya | tidak |
| Transaksi (riwayat, cetak ulang, batalkan nota) | semua | milik sendiri, tidak bisa batalkan |
| Laporan (harian, bulanan, rentang, CSV, cetak) | ya | tidak |
| Pengguna | ya | tidak |
| Pengaturan (info toko, backup, restore, reset) | ya | hanya ganti password |

## Laporan

Pemasukan, pembelian, jumlah barang terjual, keuntungan kotor, barang terlaris, riwayat stok, rekap per hari, dengan filter harian / bulanan / rentang tanggal. Bisa diunduh sebagai CSV (buka di Excel) atau dicetak.

- Pemasukan = total nota yang berhasil (setelah diskon), nota batal tidak dihitung.
- Keuntungan kotor = pemasukan dikurangi harga modal barang yang terjual (modal dicatat saat transaksi).
- Pembelian = barang masuk dengan alasan "Pembelian" x harga modal. Stok awal dan koreksi tidak dihitung sebagai pembelian.

## Backup dan restore

- **Pengaturan > Unduh backup** menghasilkan file `.json`. Lakukan rutin (mis. tiap minggu) dan simpan di flashdisk atau Google Drive. Dashboard mengingatkan jika backup lebih dari 7 hari.
- **Pulihkan dari backup** mengganti seluruh data dengan isi file (ada konfirmasi). Juga tersedia di layar masuk, berguna bila pindah komputer.
- Membersihkan data browser (cache / cookies / site data) akan menghapus data aplikasi. Tanpa backup, data tidak bisa dikembalikan.

## Lupa password, pulihkan akun, hapus akun

- Semua kolom password punya tombol **Lihat / Sembunyi**.
- Tiap akun punya **kode pemulihan** (format XXXX-XXXX-XXXX), ditampilkan **sekali** saat akun dibuat. Catat dan simpan.
- Di layar masuk, di bawah tombol Masuk ada **Lupa password?**: isi username, kode pemulihan, dan password baru. Setelah berhasil, kode diganti dengan yang baru (catat lagi). 5 kali salah menunggu 1 menit.
- Kasir yang kehilangan kode: pemilik klik **Pengguna > Edit** lalu isi password baru.
- **Pulihkan akun**: mengembalikan seluruh data dan akun dari file backup (.json). Dipakai bila pemilik kehilangan password dan kode, atau pindah komputer.
- **Pengaturan > Kode pemulihan** membuat kode baru (kode lama tidak berlaku). **Pengaturan > Hapus akun saya** menghapus akun sendiri. Jika itu satu-satunya pemilik, seluruh data toko ikut terhapus dan aplikasi kembali ke pengaturan awal.

## Catatan keamanan

Aplikasi ini berjalan sepenuhnya di browser. Password disimpan sebagai hash SHA-256 berkunci garam, tetapi siapa pun yang punya akses ke komputer dan DevTools tetap bisa membaca data. Login berguna untuk membedakan peran pemilik dan kasir di toko, bukan sebagai pengaman data tingkat bank. Jika lupa password satu-satunya pemilik, pulihkan dari file backup lama.

## Struktur file

```
stok-warung/
  index.html                 kerangka halaman
  style.css                  tampilan (biru putih, mobile first, gaya cetak)
  fonts.css                  font Inter tertanam, agar huruf sama di semua perangkat
  script.js                  seluruh logika aplikasi
  stok-warung-satu-file.html salinan gabungan (HTML+CSS+JS+font dalam 1 file) untuk dibuka di HP
  README.md                  panduan ini
```
