-- RLS Policies for Gamification Tables

-- 1. Badges: Herkes görüntüleyebilir (okuma)
CREATE POLICY "Badges viewable by everyone" ON badges
FOR SELECT USING (true);

-- 2. User Badges: Herkes görüntüleyebilir (sadece kazanılanlar)
CREATE POLICY "User badges viewable by everyone" ON user_badges
FOR SELECT USING (true);

-- 3. Points Log: Herkes görüntüleyebilir (şeffaflık için)
-- İstenirse sadece kendi loglarını görmesi için: USING (auth.uid() = user_id) yapılabilir.
-- Şimdilik herksi açık yapıyoruz.
CREATE POLICY "Points log viewable by everyone" ON points_log
FOR SELECT USING (true);

-- NOT: INSERT/UPDATE işlemleri için policy yazılmıyor.
-- Bu işlemler sadece Service Role (Backend) tarafından yapılacak.
