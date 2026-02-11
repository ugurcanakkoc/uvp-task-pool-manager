# UVW Havuz Yönetim Sistemi — Kullanıcı Kabul Testi (UAT) Rehberi

Bu rehber, **Step 9** (Yan Görevler & Bildirimler) ve **Step 10** (Gamification) özelliklerini test etmeniz için hazırlanmıştır.

## 👥 Test Rolleri

Test sırasında aşağıdaki kullanıcıları (veya benzer yetkideki kendi kullanıcılarınızı) kullanabilirsiniz:

| Rol | Kullanıcı (Örnek) | Yetkileri |
|-----|-------------------|-----------|
| **GM (Yönetici)** | `mustafa@uvw.de` | Görev oluşturur, onaylar, herkesi görür. |
| **Worker (Çalışan)** | `kerem@uvw.de` | Görev tamamlar, puan kazanır, yan görev ekler. |

> **Not:** Eğer bu kullanıcıların şifresini bilmiyorsanız, Supabase panelinden "Authentication" sekmesinden yeni şifre belirleyebilir veya "Sign Up" sayfasından yeni bir kullanıcı oluşturup veritabanından rolünü güncelleyebilirsiniz.

---

## 🧪 Test Senaryosu 1: GM Olarak Görev Yönetimi

**Amaç:** Görev oluşturmak, atamak ve çalışanların ilerlemesini takip etmek.

1.  **Giriş Yap:** GM hesabıyla sisteme girin.
2.  **Dashboard:** GM Dashboard'unun yüklendiğini doğrulayın.
3.  **Liderlik Tablosu:** Sol menüden **"Liderlik Tablosu"**na tıklayın.
    *   [ ] Sayfa açılıyor mu?
    *   [ ] Listede kullanıcılar ve puanları görünüyor mu?
4.  **Görev Oluştur:**
    *   **"Görev Havuzu"** sayfasına gidin.
    *   **"Yeni Görev"** butonuna basın.
    *   Başlık: `Test Görevi - Gamification`
    *   Atanan Kişi: `Kerem Efe Aydoğdu` (veya test worker'ınız)
    *   Görevi oluşturun.
5.  **Çıkış Yap:** Sağ üst menüden çıkış yapın.

---

## 🧪 Test Senaryosu 2: Worker Olarak Tamamlama & Puan Kazanma

**Amaç:** Görevi tamamlamak, puan kazanmak ve yan görev eklemek.

1.  **Giriş Yap:** Worker hesabıyla (`kerem@uvw.de`) girin.
2.  **Bildirim Kontrolü:** Sağ üstteki 🔔 (Zil) ikonuna tıklayın.
    *   [ ] "Yeni Görev Atandı" bildirimi gelmiş mi?
    *   [ ] Bildirimi okundu olarak işaretleyin.
3.  **Görevi Bul:** Dashboard'da veya "Görev Havuzu" sayfasında atanan görevi bulun.
4.  **İlerleme Gir:**
    *   Görevin üzerindeki işlem menüsünden (veya detaydan) **"İlerleme Ekle"** diyin.
    *   Mesaj: `Görev üzerinde çalışmaya başladım, test yapıyorum.` (Min 50 karakter)
    *   Kaydedin.
5.  **Görevi Teslim Et:**
    *   Tasks sayfasında kartın üzerindeki **"Tamamla & Teslim Et"** (Kağıt uçak ikonu) butonuna basın.
    *   Not: `Görevi tamamladım, kontrole gönderiyorum.`
    *   Gönderin. (Durum: `review` olmalı)
6.  **Yan Görev Ekle:**
    *   Dashboard'da **"Yan Görevler"** tabına geçin (veya Yan Görevlerim listesi).
    *   **"+"** ikonuna basıp yeni yan görev ekleyin (Örn: "Ofis temizliği").
    *   Görevi listede bulun ve **"Tamamla"** (Yeşil Tik) butonuna basın.
    *   [ ] "Yan görev tamamlandı! +10 Puan" uyarısı çıktı mı?
7.  **Puan Kontrolü:**
    *   Liderlik Tablosu'na gidin. Puanınızın arttığını teyit edin.
8.  **Çıkış Yap.**

---

## 🧪 Test Senaryosu 3: GM Olarak Onaylama & Rozet

**Amaç:** Teslim edilen görevi onaylamak ve puanın yansıdığını görmek.

1.  **Giriş Yap:** GM hesabıyla tekrar girin.
2.  **Bildirim:** Zil ikonunda "Onay Bekleyen Görev" bildirimi gelmiş mi?
3.  **Onaylama:**
    *   "Görev Havuzu"na gidin. Durumu `review` (Gözden Geçirme) olan görevi bulun.
    *   Kart üzerindeki **"İncele"** butonuna basın.
    *   **"Onayla ve Tamamla"** butonuna basın.
    *   [ ] "Görev onaylandı! Çalışana 50 puan kazandırıldı" mesajını gördünüz mü?
4.  **Final Kontrol:**
    *   Liderlik Tablosu'na tekrar bakın.
    *   Worker'ın puanı artmış (Örn: +50 görev + 10 yan görev = 60 puan artış) olmalı.
    *   Eğer 100 puanı geçtiyse **"Bronz Çalışan"** rozeti gelmiş mi?

---

## 🐞 Hata Bildirimi
Test sırasında bir hata alırsanız lütfen ekran görüntüsü veya hata mesajını bana iletin.

---

## 🧪 Test Senaryosu 4: Gönüllülük Sistemi (Yeni)

**Amaç:** Açık bir göreve başvurmak (gönüllü olmak), yönetici olarak bu başvuruyu yönetmek.

1. **GM Olarak Görev Açma:**
   - GM hesabıyla giriş yapın.
   - "Yeni Görev" oluşturun ancak "Atanan Kişi" seçmeyin (Boş bırakın).
   - Görev "Açık" (Open) statüsünde havuza düşmeli.
   - Çıkış yapın.

2. **Worker Olarak Başvuru:**
   - Worker hesabıyla giriş yapın.
   - `/pool` (Görev Havuzu) sayfasına gidin.
   - Oluşturulan görevi bulun.
   - **"Göreve Talip Ol"** butonuna basın.
   - Butonun **"Başvuruldu"** (veya "Başvuruyu Çek") olarak değiştiğini doğrulayın.
   - Çıkış yapın.

3. **GM Olarak Onaylama:**
   - GM hesabıyla giriş yapın.
   - Havuz sayfasına gidin. Görevin üzerinde **"1 Adayı İncele"** butonunu görmelisiniz.
   - Butona tıklayın. Açılan pencerede Worker'ı görün.
   - **"Onayla"** (Yeşil Tik) butonuna basın.
   - Görevin statüsü "Devam Ediyor" (In Progress) olmalı ve o kişiye atanmalı.

4. **Alternatif: Reddetme:**
   - (İsteğe bağlı) Aynı adımları tekrarlayıp "Reddet" butonunu test edebilirsiniz. Aday listeden silinmeli.

---

## 🧪 Test Senaryosu 5: Takvim Detayları (Yeni)

**Amaç:** Gantt şemasındaki görev detaylarını görüntülemek.

1. **Takvime Git:** GM veya Worker olarak giriş yapın.
2. **Takvim Görünümü:** Sol menüden **"Takvim"**e tıklayın.
3. **Detay Görüntüleme:**
   - Takvimdeki renkli görev bloklarından birine tıklayın.
   - Açılan pencerede (Popup) şunları doğrulayın:
     - Görev Başlığı ve Açıklaması
     - Atanan Kişi (Avatar ve İsim)
     - Başlangıç/Bitiş Tarihleri
     - Durum ve Öncelik Bilgisi
