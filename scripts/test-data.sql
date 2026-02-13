-- UVW Pool Management System - Comprehensive Test Data Script
-- Run this in your Supabase SQL Editor

-- 1. Helper to get some user IDs
-- This script assumes you have users in your 'users' table.

-- 2. Clean up existing test data (Optional, be careful)
-- DELETE FROM personal_tasks WHERE title LIKE 'TEST:%';

-- 3. Create Overlapping Personal Tasks for current day
-- Adjust 'CURRENT_DATE' to today's date if needed, or use NOW()
DO $$
DECLARE
    target_user_id UUID;
    other_user_id UUID;
    today DATE := CURRENT_DATE;
BEGIN
    -- Get two active users
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;
    SELECT id INTO other_user_id FROM auth.users OFFSET 1 LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- Task 1: Morning Focus (9:00 - 12:00)
        INSERT INTO personal_tasks (user_id, title, description, start_date, end_date, is_full_day, is_recurring)
        VALUES (target_user_id, 'TEST: Sabah Toplantısı', 'Genel koordinasyon toplantısı', 
                (today + time '09:00')::timestamp, (today + time '12:00')::timestamp, false, false);

        -- Task 2: Conflict (11:00 - 13:00) -> Overlaps with Task 1
        INSERT INTO personal_tasks (user_id, title, description, start_date, end_date, is_full_day, is_recurring)
        VALUES (target_user_id, 'TEST: ÇAKIŞAN İŞ', 'Bu iş diğeriyle çakışıyor!', 
                (today + time '11:00')::timestamp, (today + time '13:00')::timestamp, false, false);

        -- Task 3: Afternoon Deep Work (14:00 - 17:00)
        INSERT INTO personal_tasks (user_id, title, description, start_date, end_date, is_full_day, is_recurring)
        VALUES (target_user_id, 'TEST: Kod Geliştirme', 'Yeni modül entegrasyonu', 
                (today + time '14:00')::timestamp, (today + time '17:00')::timestamp, false, false);

        -- Task 4: Full Day Item
        INSERT INTO personal_tasks (user_id, title, description, start_date, end_date, is_full_day, is_recurring)
        VALUES (target_user_id, 'TEST: Tam Gün Etkinliği', 'Eğitim veya konferans', 
                (today + time '08:00')::timestamp, (today + time '18:00')::timestamp, true, false);
                
        -- Task 5: Recurring Task (Every Friday if today is Friday)
        INSERT INTO personal_tasks (user_id, title, description, start_date, end_date, is_full_day, is_recurring, recurring_days)
        VALUES (target_user_id, 'TEST: Haftalık Rapor', 'Her hafta Cuma günü yapılır', 
                (today + time '16:00')::timestamp, (today + time '17:00')::timestamp, false, true, ARRAY[5]);
    END IF;

    IF other_user_id IS NOT NULL THEN
        -- Some tasks for another person
        INSERT INTO personal_tasks (user_id, title, description, start_date, end_date, is_full_day)
        VALUES (other_user_id, 'TEST: Diğer Personel İşi', 'Başka birine ait ajanda kaydı', 
                (today + time '10:00')::timestamp, (today + time '15:00')::timestamp, false);
    END IF;
END $$;

-- 4. Create Project Bookings (if you want to test merged view)
-- Note: This requires existing tasks in the 'tasks' table.
-- Adjust as needed or just rely on personal_tasks for basic visual test.
