-- 七七伴学 P1：六张业务表 + RLS 行级隔离
-- owner_id 使用 text 类型，与 auth.uid() 返回类型一致（CloudBase PG 官方要求）
-- 幂等核心：checkins 表 (subject_id, date) 唯一约束

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  avatar_id text NOT NULL,
  birthday date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  icon_id text NOT NULL,
  stars integer NOT NULL DEFAULT 1 CHECK (stars >= 1),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL DEFAULT auth.uid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id),
  date date NOT NULL,
  stars_awarded integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkins_subject_date_unique UNIQUE (subject_id, date)
);

CREATE TABLE IF NOT EXISTS public.star_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL DEFAULT auth.uid(),
  delta integer NOT NULL,
  reason text NOT NULL,
  ref_type text,
  ref_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  stars integer NOT NULL CHECK (stars >= 1),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wish_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL DEFAULT auth.uid(),
  wish_id uuid REFERENCES public.wishes(id),
  stars_spent integer NOT NULL CHECK (stars_spent >= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_owner ON public.profiles (owner_id);
CREATE INDEX IF NOT EXISTS idx_subjects_owner ON public.subjects (owner_id);
CREATE INDEX IF NOT EXISTS idx_checkins_owner_date ON public.checkins (owner_id, date);
CREATE INDEX IF NOT EXISTS idx_star_ledger_owner ON public.star_ledger (owner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wishes_owner ON public.wishes (owner_id);
CREATE INDEX IF NOT EXISTS idx_wish_redemptions_owner ON public.wish_redemptions (owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.subjects, public.checkins, public.star_ledger, public.wishes, public.wish_redemptions TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_owner_all ON public.profiles
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY subjects_owner_all ON public.subjects
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY checkins_owner_all ON public.checkins
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY star_ledger_owner_all ON public.star_ledger
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY wishes_owner_all ON public.wishes
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY wish_redemptions_owner_all ON public.wish_redemptions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
