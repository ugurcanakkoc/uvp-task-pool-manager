---
name: supabase-migration
description: Supabase veritabanı migration'ı oluşturur. Yeni tablo, kolon veya index eklerken kullan.
---
# Supabase Migration Skill

Yeni migration oluştururken:
1. `supabase/migrations/` dizininde tarih prefix'li SQL dosyası oluştur
2. Dosya adı formatı: `YYYYMMDDHHMMSS_aciklama.sql`
3. Her migration'da `CREATE TABLE` varsa mutlaka RLS policy'si de ekle
4. Her tabloda `created_at TIMESTAMPTZ DEFAULT NOW()` olmalı
5. Foreign key'lerde ON DELETE davranışını belirt
6. Index'leri unutma (özellikle FK kolonları ve sık sorgulanan alanlar)
7. `audit_logs` tablosuna ASLA UPDATE/DELETE policy ekleme
