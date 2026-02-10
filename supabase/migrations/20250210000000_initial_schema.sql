-- UVW Havuz Yönetim Sistemi - Initial Schema

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- users: Kullanıcılar
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('gm', 'owner', 'worker')),
    department      VARCHAR(50),           -- Yazılım, SPS, E-Konstrüksiyon, Üretim vb.
    pool_percentage INTEGER DEFAULT 100 CHECK (pool_percentage IN (0, 50, 100)),
    can_production  BOOLEAN DEFAULT false, -- Üretimde çalıştırılabilir mi?
    location        VARCHAR(20) DEFAULT 'office' CHECK (location IN ('office', 'home_office', 'production')),
    status          VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'training', 'on_leave')),
    utilization     INTEGER DEFAULT 0 CHECK (utilization BETWEEN 0 AND 100),
    total_points    INTEGER DEFAULT 0,
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- skills: Yetenek Havuzu
CREATE TABLE IF NOT EXISTS skills (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name      VARCHAR(100) NOT NULL,
    skill_level     VARCHAR(20) NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    description     TEXT,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- tasks: Havuz Görevleri
CREATE TABLE IF NOT EXISTS tasks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    department          VARCHAR(50) NOT NULL,
    owner_id            UUID NOT NULL REFERENCES users(id),
    assigned_worker_id  UUID REFERENCES users(id),
    priority            INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 4),
    customer_deadline   DATE,
    order_number        VARCHAR(50),
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    task_type           VARCHAR(20) NOT NULL CHECK (task_type IN ('pool', 'development')),
    is_production       BOOLEAN DEFAULT false,
    is_strategic        BOOLEAN DEFAULT false,
    status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'active', 'completed', 'returned', 'cancelled', 'review')),
    return_reason       TEXT,
    returned_at         TIMESTAMPTZ,
    gm_approved         BOOLEAN DEFAULT false,
    gm_approved_by      UUID REFERENCES users(id),
    volunteer_id        UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- task_progress: Görev İlerleme Kayıtları
CREATE TABLE IF NOT EXISTS task_progress (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL CHECK (char_length(content) >= 50),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- task_reviews: Görev Teslim & Kontrol
CREATE TABLE IF NOT EXISTS task_reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    submitted_by    UUID NOT NULL REFERENCES users(id),
    reviewed_by     UUID REFERENCES users(id),
    submit_note     TEXT,
    review_status   VARCHAR(20) DEFAULT 'pending'
                    CHECK (review_status IN ('pending', 'approved', 'revision_requested')),
    review_note     TEXT,
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ
);

-- side_tasks: Yan Görevler
CREATE TABLE IF NOT EXISTS side_tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    assigned_to     UUID NOT NULL REFERENCES users(id),
    created_by      UUID NOT NULL REFERENCES users(id),
    deadline        DATE,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'completed', 'cancelled', 'postpone_requested', 'cancel_requested')),
    postpone_reason TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- bookings: Buklama Kayıtları
CREATE TABLE IF NOT EXISTS bookings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    worker_id   UUID NOT NULL REFERENCES users(id),
    owner_id    UUID NOT NULL REFERENCES users(id),
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- badges: Rozet Tanımları
CREATE TABLE IF NOT EXISTS badges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    icon        VARCHAR(50) NOT NULL,
    color       VARCHAR(7) NOT NULL,
    criteria    TEXT NOT NULL
);

-- user_badges: Kazanılan Rozetler
CREATE TABLE IF NOT EXISTS user_badges (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id    UUID NOT NULL REFERENCES badges(id),
    earned_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- points_log: Puan Geçmişi
CREATE TABLE IF NOT EXISTS points_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points      INTEGER NOT NULL,
    reason      VARCHAR(100) NOT NULL,
    reference_type VARCHAR(20),
    reference_id   UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- notifications: Bildirimler
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        TEXT,
    is_read     BOOLEAN DEFAULT false,
    reference_type VARCHAR(20),
    reference_id   UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- owner_support_requests: Owner Destek Talepleri
CREATE TABLE IF NOT EXISTS owner_support_requests (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES users(id),
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status      VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs: Denetim İzi (SİLİNEMEZ)
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    user_agent  TEXT,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_skills_user ON skills(user_id);
CREATE INDEX idx_skills_name ON skills(skill_name);
CREATE INDEX idx_skills_approval ON skills(approval_status);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_worker ON tasks(assigned_worker_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_dates ON tasks(start_date, end_date);
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_progress_task ON task_progress(task_id);
CREATE INDEX idx_progress_date ON task_progress(created_at);
CREATE INDEX idx_reviews_task ON task_reviews(task_id);
CREATE INDEX idx_reviews_status ON task_reviews(review_status);
CREATE INDEX idx_sidetasks_assigned ON side_tasks(assigned_to);
CREATE INDEX idx_sidetasks_status ON side_tasks(status);
CREATE INDEX idx_bookings_worker ON bookings(worker_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_active ON bookings(is_active);
CREATE INDEX idx_points_user ON points_log(user_id);
CREATE INDEX idx_points_date ON points_log(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_date ON notifications(created_at);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- 4. RLS POLICIES

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE side_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Herkes kendi profilini görebilir, GM/Owner herkesi
CREATE POLICY "Users viewable by self or higher" ON users
FOR SELECT USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) IN ('gm', 'owner'));

-- Policy: Yetenekler herkes tarafından görülebilir, sadece sahibi veya GM düzenleyebilir
CREATE POLICY "Skills visible to all" ON skills FOR SELECT USING (true);
CREATE POLICY "Skills managed by owner or GM" ON skills
FOR ALL USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'gm');

-- Policy: Görevler yetkiye uygun görülebilir
CREATE POLICY "Tasks visibility" ON tasks
FOR SELECT USING (assigned_worker_id = auth.uid() OR owner_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) IN ('gm', 'owner'));

-- Policy: Audit logs - INSERT only, GM can select
CREATE POLICY "Audit logs insertable by all" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Audit logs viewable by GM" ON audit_logs FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'gm');

-- (Diğer detaylı RLS'ler projeye özel API route geliştirildikçe sıkılaştırılacaktır)
