-- UVW Havuz Yönetim Sistemi - Seed Data

-- 1. BADGES
INSERT INTO badges (code, name, description, icon, color, criteria) VALUES
('haftanin-yildizi', 'Haftanın Yıldızı', 'Haftada en çok puan toplayan', 'star', '#F59E0B', 'Haftada en çok puan toplayan'),
('itfaiyeci', 'İtfaiyeci', '3+ acil (Öncelik 2) görevi başarıyla tamamlayan', 'flame', '#EF4444', '3+ acil (Öncelik 2) görevi başarıyla tamamlayan'),
('takim-oyuncusu', 'Takım Oyuncusu', 'Bir ayda 3+ farklı Owner''a yardım eden', 'users', '#3B82F6', 'Bir ayda 3+ farklı Owner''a yardım eden'),
('gonullu', 'Gönüllü', '5+ kez havuz ilan panosundan talip olan', 'hand-metal', '#10B981', '5+ kez havuz ilan panosundan talip olan'),
('streak-ustasi', 'Streak Ustası', 'Art arda 4 hafta tüm görevlerini zamanında tamamlayan', 'zap', '#8B5CF6', 'Art arda 4 hafta tüm görevlerini zamanında tamamlayan'),
('ayin-mvp', 'Ayın MVP''si', 'Aylık en yüksek puan', 'trophy', '#F59E0B', 'Aylık en yüksek puan'),
('keskin-nisanci', 'Keskin Nişancı', '10 görev üst üste Owner''dan ilk onayda geçen', 'target', '#EC4899', '10 görev üst üste Owner''dan ilk onayda geçen'),
('cok-yonlu', 'Çok Yönlü', '3+ farklı alanda (departman) görev tamamlayan', 'sparkles', '#6366F1', '3+ farklı alanda (departman) görev tamamlayan')
ON CONFLICT (code) DO NOTHING;

-- 2. USERS (Seed list from specification)
-- Note: Passwords will need to be set via Auth later, or we can add them here if using auth scheme.
-- For now, we seed the profiles.
INSERT INTO users (email, full_name, role, department, pool_percentage, location, can_production) VALUES
('hasan@uvw.de', 'Hasan Uzun', 'gm', 'Yönetim', 0, 'office', false),
('mustafa@uvw.de', 'Mustafa Vural', 'gm', 'Yönetim', 0, 'office', false),
('furkan@uvw.de', 'Furkan Ali Tunç', 'owner', 'Yazılım', 0, 'office', false),
('mehmet@uvw.de', 'Mehmet Karataş', 'owner', 'Konstrüksiyon', 0, 'office', false),
('yasin@uvw.de', 'Yasin Dönmez', 'owner', 'Üretim', 0, 'office', false),
('mert@uvw.de', 'Mert Günay', 'owner', 'İK & Satış', 0, 'office', false),
('bahtiyar@uvw.de', 'Bahtiyar Bayır', 'owner', 'Finans', 50, 'office', false),
('ugur@uvw.de', 'Uğur Can Akkoç', 'owner', 'Yapay Zekâ', 50, 'office', false),
('batuhan@uvw.de', 'Batuhan Ak', 'owner', 'Teklif/ERP', 0, 'office', false),
('kerem@uvw.de', 'Kerem Efe Aydoğdu', 'worker', 'Yazılım', 100, 'office', false),
('fatih@uvw.de', 'Fatih Köse', 'worker', 'Yazılım', 100, 'office', false),
('emre@uvw.de', 'Emre Demir', 'worker', 'Yazılım', 100, 'office', false),
('berke@uvw.de', 'Berke Karaca', 'worker', 'SPS', 100, 'office', false),
('alperen@uvw.de', 'Alp Eren Arıcı', 'worker', 'SPS', 100, 'office', false),
('bugra@uvw.de', 'Buğra Berkcan Bektaş', 'worker', 'E-Konstrüksiyon', 100, 'office', false),
('tugrul@uvw.de', 'Tuğrul Özen', 'worker', 'E-Konstrüksiyon', 100, 'office', false),
('sila@uvw.de', 'Sıla Zengin', 'worker', 'E-Konstrüksiyon', 100, 'office', false),
('burak@uvw.de', 'Burak Sevgi', 'worker', 'Üretim', 100, 'production', true)
ON CONFLICT (email) DO NOTHING;
