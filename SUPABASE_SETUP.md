# Panduan Koneksi Database Cloud (Supabase)

Dashboard ini sekarang mendukung sinkronisasi data ke Cloud menggunakan **Supabase** (Gratis). Ini memungkinkan data tersimpan aman dan bisa diakses oleh banyak pengguna.

## Langkah 1: Buat Project Supabase
1. Buka [https://supabase.com](https://supabase.com) dan Sign Up / Login.
2. Klik **"New Project"**.
3. Beri nama (misal: `HC-Tracker`).
4. Tunggu beberapa menit hingga database siap.

## Langkah 2: Buat Tabel Database
1. Di sidebar kiri Supabase, klik **SQL Editor** (ikon terminal `>_`).
2. Klik **New Query**.
3. Copy & Paste kode berikut ke editor:

```sql
-- Membuat tabel initiatives dengan format fleksibel (JSONB)
create table initiatives (
  id bigint primary key,
  content jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Mengaktifkan Row Level Security (opsional, untuk keamanan)
alter table initiatives enable row level security;

-- Membuat policy agar publik bisa akses (untuk kemudahan awal)
-- Untuk keamanan lebih tinggi, batasi ini nanti.
create policy "Allow Public Access" 
on initiatives for all 
using (true) 
with check (true);
```

4. Klik **Run** (tombol hijau). Pastikan tertulis "Success".

## Langkah 3: Koneksikan ke Dashboard
1. Di sidebar kiri Supabase, klik **Project Settings** (ikon gear/roda gigi).
2. Pilih menu **API**.
3. Copy **Project URL**.
4. Copy **anon / public** Key (Jangan gunakan `service_role`).

## Langkah 4: Masukkan Kunci di Aplikasi
1. Buka **Dashboard Overview**.
2. Klik tombol **"Local / Cloud"** (ikon awan) di area Header (sebelah filter).
3. Paste **URL** dan **Key** yang tadi dicopy.
4. Klik **Connect & Sync**.

Jika berhasil, indikator akan berubah menjadi **Online (Biru)** dan data Anda akan disinkronkan.

---
### Catatan Penting
- Data lama di LocalStorage (Browser) akan tetap ada saat pertama connect.
- Setelah connect, aplikasi akan mencoba mengambil data dari Cloud.
- Jika Cloud kosong tetapi Local ada data, segera lakukan **Edit & Save** pada salah satu Project untuk memicu upload ke Cloud, atau tambahkan Project baru.
- Fitur ini menggunakan pola *Upsert* (Update/Insert), data terakhir yang disimpan akan menimpa data server.
