# Proje Kuralları — UVW Havuz Yönetim Sistemi

## Genel Kurallar
- Bu proje Next.js 14+ App Router kullanır. Pages Router KULLANMA.
- TypeScript zorunludur. `any` tipi YASAKTIR.
- Tüm bileşenler fonksiyonel component olmalı, class component YASAK.
- Tailwind CSS kullan, inline style YASAK.
- shadcn/ui bileşenlerini kullan, kendi UI bileşeni yazma (gerek olmadıkça).
- Türkçe yorum satırları yaz.
- Console.log'ları production kodda bırakma.
- **ZORUNLU:** UI kodlarında hangi ikonun/butonun hangi kodu temsil ettiğini açıklayan detaylı yorum satırları ekle. Değişiklik yapılması gerektiğinde kolaylık sağlamalıdır.

## Dosya Yapısı
- Sayfa dosyaları: `src/app/(dashboard)/[route]/page.tsx`
- Bileşenler: `src/components/[kategori]/[BilesenAdi].tsx`
- API Routes: `src/app/api/[endpoint]/route.ts`
- Tipler: `src/types/[entity].ts`
- Validasyonlar: `src/lib/validations/[entity].ts`
- Sabitler: `src/lib/constants.ts`

## Veritabanı
- Supabase client kullan, ham SQL yazma.
- Her query'de RLS'e güven, ama API route'larda da yetki kontrolü yap.
- SUPABASE_SERVICE_ROLE_KEY sadece server-side'da kullanılabilir — ASLA client component'e koyma.

## Güvenlik
- Tüm form inputlarını Zod ile validate et.
- API route'larında mutlaka auth kontrolü yap.
- Kullanıcı inputunu asla doğrudan SQL'e koyma.
- Hassas veriler (şifre, token) asla loglanmaz.
- Error mesajlarında iç detay verme (generic mesaj göster).

## Tasarım
- Desktop-first responsive tasarım.
- Renk paleti: Primary #2563EB, Success #10B981, Warning #F59E0B, Error #EF4444.
- Font: Inter. İkon: Lucide React.
- Minimum touch target: 44x44px.
- Loading state'lerde skeleton loader kullan.
- Boş state'lerde anlamlı mesaj + aksiyon butonu göster.

## Test
- Her yeni özellik için en az 1 unit test yaz.
- API route'ları için integration test yaz.
- Kritik akışlar için E2E test yaz (Playwright).

## Git
- Conventional Commits kullan: feat:, fix:, chore:, docs:, test:
- Her PR tek bir özellik veya fix içermeli.
- PR açıklamasında ne değiştiğini Türkçe yaz.

## Kritik Bileşenler ve Stabilite
- **Dashboard Güvenliği:** Dashboard sayfası projenin kalbidir ve şu an tam fonksiyonel çalışmaktadır (GM rolü dahil). Başka bir sayfada yapılan değişikliklerin Dashboard'u bozmamasına KRİTİK derecede önem verilir.
- **Etki Bildirimi:** Eğer yapılan bir geliştirme Dashboard'u veya ortak kullanılan (TaskDetailDialog, TaskCard vb.) bileşenleri etkiliyorsa, bu durum mutlaka kullanıcıya bildirilmeli, nedeni açıklanmalı ve en mantıklı çözüm üzerinde mutabık kalınmalıdır.
- **Kalite Standartları:** "Sadece işi çözsün" mantığıyla yazılmış geçici (quick-fix) kodlardan kaçınılmalıdır. Kodun temiz, okunabilir ve sürdürülebilir olması her şeyden önceliklidir.
- **Mimari Disiplin:** Karmaşık, dağınık kodlar ve bozuk klasör yapısı kabul edilemez. Mevcut klasör yapısına ve tip güvenliğine sadık kalınmalıdır.
- **Bileşen Yeniden Kullanımı:** Yeni bileşen oluşturmak yerine, mevcut ve test edilmiş bileşenleri (TaskDetailDialog vb.) ortaklaştırmak ve bağlamlarını bağlamak öncelikli kuraldır.
