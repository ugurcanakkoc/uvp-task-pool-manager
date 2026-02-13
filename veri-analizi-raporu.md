# Havuz Yönetim Sistemi - Detaylı Veri Analizi ve Proje Raporu

Bu rapor, "Havuz Yönetim Sistemi" projesinin mimarisini, veri yapısını, mevcut özelliklerini ve gelecek vizyonunu en ince ayrıntısına kadar belgelemek amacıyla oluşturulmuştur. Bu döküman, projenin "Raporlama ve Analiz" modülü için temel bir veri sözlüğü ve stratejik rehber niteliğindedir.

---

## 1. Projenin Amacı ve Temel Hedefleri

### 1.1. Genel Vizyon
Projenin temel amacı, bir organizasyon içindeki insan kaynaklarının (özellikle teknik ve saha personeli) projeler ve günlük işler arasındaki dağılımını optimize etmektir. "Havuz" mantığı üzerine kurulu olan sistem, personelin atıl kalmasını önlerken, proje sahiplerinin ihtiyaç duydukları uzmanlığa hızlıca ulaşmasını sağlar.

### 1.2. Stratejik Hedefler
*   **Verimlilik Takibi**: Personelin hangi projede ne kadar süre çalıştığını (doluluk oranı) netleştirmek.
*   **Çakışma Yönetimi**: Bir personelin aynı anda birden fazla kritik işe atanmasını (overbooking) önlemek.
*   **Şeffaf Onay Süreci**: Kaynak taleplerinin Genel Müdür (GM) ve Proje Sahipleri (Owner) arasında denetlenebilir bir akışla ilerlemesi.
*   **Oyunlaştırma (Gamification)**: Personel motivasyonunu artırmak için yetkinlik (Skill) ve başarı (Badge) tabanlı bir puanlama sistemi işletmek.

---

## 2. Sistem Fonksiyonları ve Modüler Yapı

### 2.1. Aktif Modüller
*   **Dashboard (Çoklu Rol)**: 
    *   **GM**: Şirket geneli doluluk, onay bekleyen kritik işler.
    *   **Owner**: Kendi projelerinin durumu, yeni destek talebi oluşturma.
    *   **Worker**: Günlük iş listesi, kişisel performans metrikleri.
*   **Gantt/Takvim**: Proje bazlı zaman çizelgesi, "Bugün" odaklı navigasyon, atanmamış işler havuzu.
*   **Destek Talebi Sistemi**: Kaynak ihtiyacının bir havuzda toplanması ve GM onayından sonra aktifleşmesi.
*   **Liderlik Tablosu**: Puan ve rozet bazlı performans sıralaması.
*   **Profil Yönetimi**: Yetkinliklerin (Skills) listelenmesi ve onaya sunulması.

### 2.2. Pasif / Geliştirme Aşamasındaki Modüller
*   **Ajanda (Gelişmiş)**: Kişisel görevlerin (meeting, leave, etc.) Gantt şemasındaki etkileşimlerinin derinleştirilmesi.
*   **Puan Entegrasyonu**: Tamamlanan işlerden kazanılan puanların otomatik hesaplanması (şuan manuel tetikleniyor/loglanıyor).
*   **Gelişmiş Raporlama**: Şu anki temel raporların ötesinde, tarihsel veri analizi ve tahminleme.

---

## 3. Veri Sözlüğü (Database Schema Audit)

### 3.1. Kullanıcı Yönetimi (`users` Tablosu)
Sistemin merkezindeki tablodur. Kimlik doğrulama ve rol yönetimi burada yapılır.
*   `id`: UUID (Primary Key)
*   `email`: Kullanıcı e-posta adresi (Unique)
*   `full_name`: Ad Soyad
*   `role`: Rol (Enum: `gm`, `owner`, `worker`)
*   `department`: Departman (Yazılım, SPS, E-Konstrüksiyon, Üretim, vs.)
*   `pool_percentage`: Havuz doluluk oranı (0, 50, 100). Personelin ne kadarının boşa çıkabileceğini belirler.
*   `can_production`: Saha/Üretim için uygunluk durumu (Boolean).
*   `location`: Çalışma lokasyonu (Enum: `office`, `home_office`, `production`).
*   `status`: Mevcut meşguliyet (Enum: `available`, `booked`, `training`, `on_leave`).
*   `utilization`: Doluluk yüzdesi (0-100).
*   `total_points`: Toplam kazanılan başarı puanı.
*   `avatar_url`: Profil fotoğrafı yolu.

### 3.2. İş ve Destek Talepleri (`tasks` Tablosu)
Projelerin ve havuzdaki taleplerin saklandığı ana tablodur.
*   `title`: İş Başlığı.
*   `description`: Detaylı açıklama.
*   `status`: Durum (Enum: `requested` (Onay Bekliyor), `pending` (Havuzda/Atama Bekliyor), `active` (Kişi Atanmış/Çalışılıyor), `completed`, `cancelled`, `review`, `returned`).
*   `priority`: Öncelik (1-4 arası, 1 en yüksek).
*   `department`: İlgili departman.
*   `owner_id`: Talebi oluşturan kişi (FK -> users).
*   `start_date` / `end_date`: İşin planlanan takvimi.
*   `task_type`: Tip (Enum: `pool` (Sadece havuz kaydı), `development` (Canlı proje/iş)).
*   `gm_approved`: GM onay bayrağı (Boolean).
*   `is_production` / `is_strategic`: İşin niteliğini belirleyen bayraklar.
*   `approved_at`: Onaylanma zamanı.

### 3.3. Rezervasyonlar ve Atamalar (`bookings` Tablosu)
Hangi personelin hangi işe, hangi tarihler arasında atandığını tutan "İlişkisel" tablodur.
*   `task_id`: Hangi iş olduğu (FK -> tasks).
*   `worker_id`: Atanan personel (FK -> users).
*   `start_date` / `end_date`: Personelin o iş için ayrılan süresi (Proje tarihinden farklı olabilir).
*   `is_active`: Atamanın güncelliği.

### 3.4. Kişisel Ajanda (`personal_tasks` Tablosu)
Personelin kendi girdiği toplantı, izin veya kişisel çalışma kayıtları.
*   `user_id`: Sahibi.
*   `occupancy_type`: Tip (Enum: `meeting`, `work`, `leave`, `training`, `personal`).
*   `can_support`: Bu ajanda kaydı varken destek verebilir mi? (Boolean).
*   `is_recurring` / `recurring_days`: Tekrarlayan görev bilgileri.

### 3.5. Başarı ve Puanlama (`badges`, `user_badges`, `points_log` Tabloları)
*   **badges**: Rozet tanımları (Kod, isim, açıklama, kriter, renk, ikon).
*   **user_badges**: Kullanıcıların kazandığı rozetler.
*   **points_log**: Puan hareketleri (Neden, ne kadar puan, ne zaman).

### 3.6. Denetim ve Geri Bildirim (`audit_logs`, `task_reviews`, `task_progress`)
*   **audit_logs**: Sistemdeki kritik değişiklikler (kim, neyi, neyden neye çevirdi).
*   **task_reviews**: İş teslimlerindeki GM/Owner inceleme notları ve onayları.
*   **task_progress**: İşin ilerleyişine dair personelin girdiği 50 karakterden uzun zorunlu raporlar.

---

## 4. İlişkisel Veri Akışı

Gantt şeması ve Dashboard verileri şu akışla çalışır:
1.  Bir **Owner**, `tasks` tablosuna `status='requested'` olan bir kayıt atar.
2.  **GM**, bu kaydı gördüğünde iki seçenek sunulur:
    *   Doğrudan kişi atayıp onaylarsa -> `status='active'` olur ve `bookings` oluşur.
    *   Kişi atamadan onaylarsa -> `status='pending'` olur. Bu talep "Atanmamış İşler" listesine düşer.
3.  **Worker**, `bookings` içinde kendi ID'sini gördüğü işleri dashboard'unda "Aktif Görevlerim" olarak görür.
4.  Gantt şeması, hem `tasks` tablosundaki genel süreyi hem de `bookings` içindeki personel bazlı kırılımları birleştirerek görselleştirir.

---

## 5. Raporlama İçin KPI Önerileri (Yol Haritası)

Yeni raporlama modülünde şu metriklerin gösterilmesi önerilir:
*   **Departman Bazlı Doluluk Oranı**: Hangi departman %100 meşgul, hangisi daha çok destek verebilir.
*   **Ortalama Tamamlanma Süresi**: Talebin onaylanması ile tamamlanması arasındaki süre.
*   **Kişi Bazlı Katkı Skoru**: Toplam puan / Tamamlanan iş sayısı orantısı.
*   **Strategic vs. Production Dağılımı**: Şirket eforunun ne kadarının uzun vadeli (stratejik), ne kadarının anlık üretim desteğine gittiği.
*   **Çakışma Raporu**: Takvimde (Ajanda + Görevler) üst üste binen toplam saat miktarı.

---
**Not:** Bu dosya, sistemdeki tüm veritabanı kısıtlamaları (constraints) ve iş mantığı (business logic) kuralları göz önüne alınarak hazırlanmıştır.
