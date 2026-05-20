
-- ============= TIMESTAMPS HELPER =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  school_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, school_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'school_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= EXAMS =============
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  class_name TEXT NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes BETWEEN 1 AND 360),
  access_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','closed')),
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  summary_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_exams_teacher ON public.exams(teacher_id);
CREATE INDEX idx_exams_access_code ON public.exams(access_code);

CREATE POLICY "Teachers manage own exams" ON public.exams
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= QUESTIONS =============
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_questions_exam ON public.questions(exam_id);

CREATE POLICY "Teachers manage own questions" ON public.questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid())
  );

-- ============= OPTIONS =============
-- is_correct is the SENSITIVE field — never expose to students.
CREATE TABLE public.options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  position INT NOT NULL DEFAULT 0
);
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_options_question ON public.options(question_id);

-- Only teachers (owners of the parent exam) can read or write options directly.
-- Students NEVER read this table directly; they go through a SECURITY DEFINER function.
CREATE POLICY "Teachers manage own options" ON public.options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.exams e ON e.id = q.exam_id
      WHERE q.id = question_id AND e.teacher_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.exams e ON e.id = q.exam_id
      WHERE q.id = question_id AND e.teacher_id = auth.uid()
    )
  );

-- ============= ROSTER STUDENTS =============
CREATE TABLE public.roster_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_number)
);
ALTER TABLE public.roster_students ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_roster_exam ON public.roster_students(exam_id);

CREATE POLICY "Teachers manage own roster" ON public.roster_students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid())
  );

-- ============= SUBMISSIONS =============
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  roster_student_id UUID NOT NULL REFERENCES public.roster_students(id) ON DELETE CASCADE,
  student_full_name TEXT NOT NULL,
  student_number TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INT,
  total_questions INT,
  time_taken_seconds INT,
  UNIQUE (exam_id, roster_student_id)
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_submissions_exam ON public.submissions(exam_id);

CREATE POLICY "Teachers view own submissions" ON public.submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.teacher_id = auth.uid())
  );

-- ============= ANSWERS =============
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  UNIQUE (submission_id, question_id)
);
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_answers_submission ON public.answers(submission_id);

CREATE POLICY "Teachers view own answers" ON public.answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.exams e ON e.id = s.exam_id
      WHERE s.id = submission_id AND e.teacher_id = auth.uid()
    )
  );

-- ============= STORAGE BUCKET =============
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-media', 'exam-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read exam media" ON storage.objects
  FOR SELECT USING (bucket_id = 'exam-media');

CREATE POLICY "Teachers upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exam-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers update own folder" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exam-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Teachers delete own folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exam-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
