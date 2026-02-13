# Havuz Yönetim Sistemi (Pool Management System)

Havuz Yönetim Sistemi, havuz personeli, yöneticiler ve proje sahipleri için tasarlanmış, gerçek zamanlı veri senkronizasyonu sunan premium bir yönetim panelidir. Modern web teknolojileriyle inşa edilen bu sistem, görev takibi, onay süreçleri ve personel verimliliğini tek bir merkezden yönetmeyi sağlar.

## 🚀 Temel Özellikler

- **Gelişmiş Rol Bazlı Dashboard**: 
  - **GM (Genel Müdür)**: Tüm saha operasyonunu, onayları ve personel doluluk oranlarını tek bir ekrandan izler.
  - **Owner (Proje Sahibi)**: Kendi projelerine ait onayları yönetir ve takımının çalışma durumunu takip eder.
  - **Worker (Çalışan)**: Günlük görevlerini, kişisel ajandasını ve performans metriklerini görüntüler.
- **Çoklu Gün Zaman Çizelgesi (Ajanda)**: Görevlerin çakışma tespiti, sürükle-bırak (drag-drop) ve boyutlandırma ile yönetimi.
- **Gerçek Zamanlı Bildirimler**: Görev atamaları ve onay süreçlerinde anlık geri bildirim sistemi.
- **Verimlilik Analizi**: Recharts ile görselleştirilmiş personel performans ve doluluk ısı haritaları.
- **Uluslararası Dil Desteği (i18n)**: Türkçe ve İngilizce tam yerelleştirme.

## 🛠️ Teknoloji Yığını

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Veritabanı & Auth**: [Supabase](https://supabase.com/)
- **Stil**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **İkonlar**: [Lucide React](https://lucide.dev/)
- **Grafikler**: [Recharts](https://recharts.org/)
- **Form Yönetimi**: React Hook Form + Zod

## ⚙️ Kurulum

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/kullanici-adi/havuz-app.git
cd havuz-app
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
# veya
pnpm install
```

### 3. Çevresel Değişkenleri Ayarlayın
`.env.local.example` dosyasını `.env.local` olarak kopyalayın ve gerekli bilgileri doldurun:
```bash
cp .env.local.example .env.local
```

### 4. Veritabanı Şemasını Uygulayın
`supabase/migrations` klasöründeki migration dosyalarını Supabase Dashboard veya CLI üzerinden uygulayın.

### 5. Uygulamayı Başlatın
```bash
npm run dev
```

## 📄 Lisans
Bu proje **MIT Lisansı** altında lisanslanmıştır. Daha fazla bilgi için [LICENSE](LICENSE) dosyasına göz atın.
