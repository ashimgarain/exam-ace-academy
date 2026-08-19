
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Learner',
  avatar_url text,
  exam_slug text,
  target_year int,
  daily_goal_minutes int NOT NULL DEFAULT 30,
  language text NOT NULL DEFAULT 'en',
  xp int NOT NULL DEFAULT 0,
  streak_count int NOT NULL DEFAULT 0,
  last_active_date date,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by signed in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1), 'Learner'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SYLLABUS
CREATE TABLE public.exams (
  slug text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.subjects (
  slug text PRIMARY KEY,
  name text NOT NULL,
  icon text,
  description text,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.exam_subjects (
  exam_slug text NOT NULL REFERENCES public.exams(slug) ON DELETE CASCADE,
  subject_slug text NOT NULL REFERENCES public.subjects(slug) ON DELETE CASCADE,
  weight text,
  PRIMARY KEY (exam_slug, subject_slug)
);
CREATE TABLE public.sections (
  slug text PRIMARY KEY,
  subject_slug text NOT NULL REFERENCES public.subjects(slug) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.chapters (
  slug text PRIMARY KEY,
  section_slug text NOT NULL REFERENCES public.sections(slug) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  sort_order int NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT false,
  est_minutes int NOT NULL DEFAULT 12
);
GRANT SELECT ON public.exams, public.subjects, public.exam_subjects, public.sections, public.chapters TO anon, authenticated;
GRANT ALL ON public.exams, public.subjects, public.exam_subjects, public.sections, public.chapters TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exams public read" ON public.exams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "subjects public read" ON public.subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "exam_subjects public read" ON public.exam_subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sections public read" ON public.sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chapters public read" ON public.chapters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage chapters" ON public.chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- LESSONS
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_slug text NOT NULL REFERENCES public.chapters(slug) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  content jsonb NOT NULL,
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chapter_slug, sort_order)
);
GRANT SELECT ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "free lesson titles readable" ON public.lessons FOR SELECT TO authenticated USING (true);

CREATE TABLE public.lesson_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  language text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, language)
);
GRANT SELECT ON public.lesson_translations TO authenticated;
GRANT ALL ON public.lesson_translations TO service_role;
ALTER TABLE public.lesson_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "translations readable" ON public.lesson_translations FOR SELECT TO authenticated USING (true);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  explanation text
);
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions readable" ON public.quiz_questions FOR SELECT TO authenticated USING (true);

-- PROGRESS
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  chapter_slug text NOT NULL,
  subject_slug text NOT NULL,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.user_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL DEFAULT now(),
  interval_days int NOT NULL DEFAULT 1,
  repetitions int NOT NULL DEFAULT 0,
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_queue TO authenticated;
GRANT ALL ON public.review_queue TO service_role;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own review queue" ON public.review_queue FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount int NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own xp" ON public.xp_events FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  minutes int NOT NULL,
  kind text NOT NULL DEFAULT 'focus',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.study_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.badges (
  slug text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  threshold int NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'xp'
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges public read" ON public.badges FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_slug text NOT NULL REFERENCES public.badges(slug) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_slug)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own badges" ON public.user_badges FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- PAYMENTS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  amount_paise int NOT NULL DEFAULT 0,
  razorpay_order_id text,
  razorpay_payment_id text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_order_idx ON public.subscriptions(razorpay_order_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  note text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reports" ON public.content_reports FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins read reports" ON public.content_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
