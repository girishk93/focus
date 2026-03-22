-- ============================================================
-- FOCUS APP — Full Database Schema (Supabase)
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────
-- PROFILES
-- id links directly to auth.users.id
-- password_hash omitted — Supabase auth handles it
-- ─────────────────────────────────────────────
CREATE TABLE profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username            VARCHAR(50)  UNIQUE NOT NULL,
    display_name        VARCHAR(100) NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    avatar_url          TEXT,
    bio                 TEXT,
    timezone            VARCHAR(50)  DEFAULT 'UTC',
    total_points        INTEGER      DEFAULT 0,
    level               INTEGER      DEFAULT 1,
    streak_current      INTEGER      DEFAULT 0,
    streak_longest      INTEGER      DEFAULT 0,
    streak_last_active  DATE,
    is_active           BOOLEAN      DEFAULT TRUE,
    is_verified         BOOLEAN      DEFAULT FALSE,
    created_at          TIMESTAMPTZ  DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  DEFAULT NOW()
);


-- ─────────────────────────────────────────────
-- FRIENDSHIPS / SOCIAL GRAPH
-- ─────────────────────────────────────────────
CREATE TABLE friendships (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    addressee_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (requester_id, addressee_id),
    CHECK (requester_id <> addressee_id)
);

CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status    ON friendships(status);


-- ─────────────────────────────────────────────
-- CATEGORIES (for tasks & habits)
-- ─────────────────────────────────────────────
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL = system default
    name        VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    color_hex   CHAR(7),
    is_default  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────
-- HABITS (recurring templates)
-- ─────────────────────────────────────────────
CREATE TABLE habits (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    frequency_type      VARCHAR(20) NOT NULL
                        CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'custom')),
    frequency_days      SMALLINT[],
    target_count        SMALLINT DEFAULT 1,
    duration_minutes    SMALLINT,
    point_value         INTEGER DEFAULT 10,
    difficulty          VARCHAR(10) DEFAULT 'medium'
                        CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
    reminder_time       TIME,
    is_archived         BOOLEAN DEFAULT FALSE,
    start_date          DATE DEFAULT CURRENT_DATE,
    end_date            DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_habits_user   ON habits(user_id);
CREATE INDEX idx_habits_active ON habits(user_id) WHERE is_archived = FALSE;


-- ─────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────
CREATE TABLE tasks (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    habit_id              UUID REFERENCES habits(id) ON DELETE SET NULL,
    category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
    title                 VARCHAR(200) NOT NULL,
    description           TEXT,
    status                VARCHAR(20) DEFAULT 'todo'
                          CHECK (status IN ('todo', 'in_progress', 'completed', 'skipped', 'failed')),
    priority              SMALLINT DEFAULT 2 CHECK (priority BETWEEN 1 AND 4),
    point_value           INTEGER DEFAULT 10,
    bonus_points          INTEGER DEFAULT 0,
    due_date              DATE,
    due_time              TIME,
    scheduled_date        DATE,
    estimated_minutes     SMALLINT,
    actual_minutes        SMALLINT,
    completed_at          TIMESTAMPTZ,
    is_recurring_instance BOOLEAN DEFAULT FALSE,
    recurrence_date       DATE,
    notes                 TEXT,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user      ON tasks(user_id);
CREATE INDEX idx_tasks_status    ON tasks(user_id, status);
CREATE INDEX idx_tasks_due       ON tasks(due_date);
CREATE INDEX idx_tasks_scheduled ON tasks(user_id, scheduled_date);


-- ─────────────────────────────────────────────
-- TASK TAGS (many-to-many)
-- ─────────────────────────────────────────────
CREATE TABLE tags (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name    VARCHAR(50) NOT NULL,
    UNIQUE (user_id, name)
);

CREATE TABLE task_tags (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);


-- ─────────────────────────────────────────────
-- FOCUS SESSIONS
-- ─────────────────────────────────────────────
CREATE TABLE focus_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
    session_type    VARCHAR(20) DEFAULT 'focus'
                    CHECK (session_type IN ('focus', 'short_break', 'long_break')),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    planned_minutes SMALLINT,
    actual_minutes  SMALLINT
                    GENERATED ALWAYS AS (
                        EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
                    ) STORED,
    was_completed   BOOLEAN DEFAULT FALSE,
    points_earned   INTEGER DEFAULT 0,
    notes           TEXT
);

CREATE INDEX idx_focus_user_date ON focus_sessions(user_id, started_at DESC);


-- ─────────────────────────────────────────────
-- POINTS LEDGER (immutable audit log)
-- ─────────────────────────────────────────────
CREATE TABLE points_ledger (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    delta            INTEGER NOT NULL,
    reason           VARCHAR(50) NOT NULL
                     CHECK (reason IN (
                         'task_completed', 'habit_streak', 'focus_session',
                         'challenge_win', 'friend_bonus', 'level_up_bonus',
                         'daily_login', 'manual_adjustment', 'penalty'
                     )),
    reference_id     UUID,
    reference_type   VARCHAR(50),
    balance_after    INTEGER NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_user_time ON points_ledger(user_id, created_at DESC);


-- ─────────────────────────────────────────────
-- LEVELS & XP THRESHOLDS
-- ─────────────────────────────────────────────
CREATE TABLE levels (
    level           SMALLINT PRIMARY KEY,
    title           VARCHAR(100) NOT NULL,
    points_required INTEGER NOT NULL,
    badge_url       TEXT
);

INSERT INTO levels (level, title, points_required) VALUES
    (1,  'Novice',       0),
    (2,  'Apprentice',   100),
    (3,  'Consistent',   300),
    (4,  'Focused',      700),
    (5,  'Disciplined',  1500),
    (6,  'Dedicated',    3000),
    (7,  'Expert',       6000),
    (8,  'Master',       12000),
    (9,  'Grandmaster',  25000),
    (10, 'Legendary',    50000);


-- ─────────────────────────────────────────────
-- ACHIEVEMENTS / BADGES
-- ─────────────────────────────────────────────
CREATE TABLE achievements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    badge_url       TEXT,
    trigger_type    VARCHAR(50),
    trigger_value   INTEGER,
    points_reward   INTEGER DEFAULT 0
);

CREATE TABLE user_achievements (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    earned_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, achievement_id)
);


-- ─────────────────────────────────────────────
-- CHALLENGES (group competitions)
-- ─────────────────────────────────────────────
CREATE TABLE challenges (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    challenge_type   VARCHAR(20) DEFAULT 'points'
                     CHECK (challenge_type IN ('points', 'tasks', 'streak', 'focus_time')),
    target_value     INTEGER,
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    is_public        BOOLEAN DEFAULT FALSE,
    max_participants SMALLINT,
    status           VARCHAR(20) DEFAULT 'upcoming'
                     CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_date > start_date)
);

CREATE TABLE challenge_participants (
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
    joined_at    TIMESTAMPTZ DEFAULT NOW(),
    score        INTEGER DEFAULT 0,
    rank         SMALLINT,
    completed    BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (challenge_id, user_id)
);


-- ─────────────────────────────────────────────
-- LEADERBOARD SNAPSHOTS
-- ─────────────────────────────────────────────
CREATE TABLE leaderboard_snapshots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope           VARCHAR(20) NOT NULL
                    CHECK (scope IN ('global', 'friends', 'challenge')),
    period          VARCHAR(20) NOT NULL
                    CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    reference_id    UUID,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rank            INTEGER NOT NULL,
    points          INTEGER NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    streak          INTEGER DEFAULT 0,
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_lb_scope_period ON leaderboard_snapshots(scope, period, snapshot_date, rank);
CREATE INDEX idx_lb_user         ON leaderboard_snapshots(user_id, period);


-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type           VARCHAR(50) NOT NULL,
    title          VARCHAR(200),
    body           TEXT,
    reference_id   UUID,
    reference_type VARCHAR(50),
    is_read        BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read, created_at DESC);


-- ─────────────────────────────────────────────
-- USER SETTINGS
-- ─────────────────────────────────────────────
CREATE TABLE user_settings (
    user_id                 UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    theme                   VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    pomodoro_work_minutes   SMALLINT DEFAULT 25,
    pomodoro_break_minutes  SMALLINT DEFAULT 5,
    pomodoro_long_break_min SMALLINT DEFAULT 15,
    daily_goal_points       INTEGER DEFAULT 50,
    daily_goal_tasks        SMALLINT DEFAULT 5,
    notifications_enabled   BOOLEAN DEFAULT TRUE,
    reminders_enabled       BOOLEAN DEFAULT TRUE,
    leaderboard_visible     BOOLEAN DEFAULT TRUE,
    profile_public          BOOLEAN DEFAULT TRUE,
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- ─────────────────────────────────────────────
-- updated_at auto-stamp
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at      BEFORE UPDATE ON profiles      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_habits_updated_at        BEFORE UPDATE ON habits        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated_at         BEFORE UPDATE ON tasks         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_friendships_updated_at   BEFORE UPDATE ON friendships   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─────────────────────────────────────────────
-- Award points + auto level-up
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION award_points(
    p_user_id        UUID,
    p_delta          INTEGER,
    p_reason         VARCHAR,
    p_reference_id   UUID    DEFAULT NULL,
    p_reference_type VARCHAR DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    new_balance INTEGER;
BEGIN
    UPDATE profiles
    SET total_points = total_points + p_delta
    WHERE id = p_user_id
    RETURNING total_points INTO new_balance;

    INSERT INTO points_ledger
        (user_id, delta, reason, reference_id, reference_type, balance_after)
    VALUES
        (p_user_id, p_delta, p_reason, p_reference_id, p_reference_type, new_balance);

    UPDATE profiles p
    SET level = (
        SELECT MAX(l.level)
        FROM levels l
        WHERE l.points_required <= p.total_points
    )
    WHERE p.id = p_user_id;
END;
$$;


-- ─────────────────────────────────────────────
-- Supabase Auth: create profile on signup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username',     split_part(NEW.email, '@', 1))
    );

    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────
-- Supabase Auth: delete profile on user removal
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_delete_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.profiles WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_delete_user();


-- ─────────────────────────────────────────────
-- Supabase Auth: sync email updates
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_update_user();


-- ─────────────────────────────────────────────
-- VIEW: friends leaderboard (live)
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_friends_leaderboard AS
SELECT
    f.requester_id AS viewer_id,
    p.id           AS friend_id,
    p.display_name,
    p.avatar_url,
    p.level,
    p.total_points,
    p.streak_current,
    RANK() OVER (
        PARTITION BY f.requester_id
        ORDER BY p.total_points DESC
    ) AS rank
FROM friendships f
JOIN profiles p ON p.id = f.addressee_id
WHERE f.status = 'accepted'

UNION ALL

SELECT
    f.addressee_id,
    p.id,
    p.display_name,
    p.avatar_url,
    p.level,
    p.total_points,
    p.streak_current,
    RANK() OVER (
        PARTITION BY f.addressee_id
        ORDER BY p.total_points DESC
    )
FROM friendships f
JOIN profiles p ON p.id = f.requester_id
WHERE f.status = 'accepted';


-- ─────────────────────────────────────────────
-- VIEW: user daily summary
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW v_daily_summary AS
SELECT
    p.id                                                                        AS user_id,
    p.display_name,
    p.total_points,
    p.level,
    p.streak_current,
    COUNT(t.id)  FILTER (WHERE t.scheduled_date = CURRENT_DATE)                AS tasks_today,
    COUNT(t.id)  FILTER (WHERE t.status = 'completed'
                           AND t.completed_at::DATE = CURRENT_DATE)            AS tasks_completed_today,
    COALESCE(SUM(pl.delta) FILTER (
        WHERE pl.created_at::DATE = CURRENT_DATE), 0)                          AS points_today,
    COALESCE(SUM(fs.actual_minutes) FILTER (
        WHERE fs.started_at::DATE = CURRENT_DATE
          AND fs.session_type = 'focus'), 0)                                   AS focus_minutes_today
FROM profiles p
LEFT JOIN tasks          t  ON t.user_id  = p.id
LEFT JOIN points_ledger  pl ON pl.user_id = p.id
LEFT JOIN focus_sessions fs ON fs.user_id = p.id
GROUP BY p.id;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots  ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- habits
CREATE POLICY "Users manage own habits"
    ON habits FOR ALL USING (auth.uid() = user_id);

-- tasks
CREATE POLICY "Users manage own tasks"
    ON tasks FOR ALL USING (auth.uid() = user_id);

-- focus_sessions
CREATE POLICY "Users manage own focus sessions"
    ON focus_sessions FOR ALL USING (auth.uid() = user_id);

-- points_ledger
CREATE POLICY "Users can read own points ledger"
    ON points_ledger FOR SELECT USING (auth.uid() = user_id);

-- notifications
CREATE POLICY "Users manage own notifications"
    ON notifications FOR ALL USING (auth.uid() = user_id);

-- user_settings
CREATE POLICY "Users manage own settings"
    ON user_settings FOR ALL USING (auth.uid() = user_id);

-- friendships
CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can manage own friendship requests"
    ON friendships FOR ALL USING (auth.uid() = requester_id);

-- categories
CREATE POLICY "Users can view own and default categories"
    ON categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users manage own categories"
    ON categories FOR ALL USING (auth.uid() = user_id);

-- tags
CREATE POLICY "Users manage own tags"
    ON tags FOR ALL USING (auth.uid() = user_id);

-- task_tags
CREATE POLICY "Users manage own task tags"
    ON task_tags FOR ALL
    USING (EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_tags.task_id
          AND t.user_id = auth.uid()
    ));

-- leaderboard_snapshots
CREATE POLICY "Authenticated users can view leaderboards"
    ON leaderboard_snapshots FOR SELECT
    TO authenticated USING (true);

-- challenge_participants
CREATE POLICY "Users can view challenge participants"
    ON challenge_participants FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Users manage own challenge participation"
    ON challenge_participants FOR ALL USING (auth.uid() = user_id);

-- user_achievements
CREATE POLICY "Achievements are publicly viewable"
    ON user_achievements FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- GROUPS & COLLABORATION
-- ─────────────────────────────────────────────

CREATE TABLE groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
    group_id VARCHAR(50) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE group_goals (
    id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_goal_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id VARCHAR(50) NOT NULL REFERENCES group_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(goal_id, user_id, completed_at::DATE)
);

-- RLS for Groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_goal_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they belong to"
    ON groups FOR SELECT
    USING (
        id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        OR creator_id = auth.uid()
    );

CREATE POLICY "Users can insert groups"
    ON groups FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update groups they created"
    ON groups FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can view members of their groups"
    ON group_members FOR SELECT
    USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage group memberships"
    ON group_members FOR ALL USING (true);

CREATE POLICY "Users can view goals of their groups"
    ON group_goals FOR SELECT
    USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage group goals"
    ON group_goals FOR ALL USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view completions in their groups"
    ON group_goal_completions FOR SELECT
    USING (
        goal_id IN (SELECT id FROM group_goals WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
    );

CREATE POLICY "Users can insert completions"
    ON group_goal_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete completions"
    ON group_goal_completions FOR DELETE USING (auth.uid() = user_id);