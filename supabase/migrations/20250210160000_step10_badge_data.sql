-- Insert point-based badges for Gamification
-- Criteria matches logic in src/lib/gamification.ts

INSERT INTO badges (code, name, description, icon, color, criteria) VALUES
('bronze_worker', 'Bronz Çalışan', '100 puana ulaşan çalışkan arı.', 'medal', 'amber-600', '100+ Puan'),
('silver_worker', 'Gümüş Çalışan', '500 barajını aşan deneyimli üye.', 'medal', 'slate-400', '500+ Puan'),
('gold_worker', 'Altın Çalışan', '1000 puanlık efsanevi performans.', 'medal', 'yellow-500', '1000+ Puan'),
('platinum_worker', 'Platin Çalışan', '5000 puan ile zirvenin sahibi.', 'crown', 'violet-500', '5000+ Puan')
ON CONFLICT (code) DO NOTHING;
