
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Auto-close exams whose closes_at has passed
CREATE OR REPLACE FUNCTION public.auto_close_exams()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.exams
  SET status = 'closed'
  WHERE status = 'active'
    AND closes_at IS NOT NULL
    AND closes_at < now();
$$;

-- Cron: every 5 minutes, close expired exams then trigger summary email webhook
SELECT cron.schedule(
  'examhub-close-and-notify',
  '*/5 * * * *',
  $$
  SELECT public.auto_close_exams();
  SELECT net.http_post(
    url := 'https://http://localhost:8080.lovable.app/api/public/hooks/exam-summary',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bWF0Z3drYnpua21ob3dianp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjAwOTAsImV4cCI6MjA5MTk5NjA5MH0.Fz80s1moQ-8-5CoJpGq_131VC1y-o3pS7Cjx454O6ck'
    ),
    body := '{}'::jsonb
  );
  $$
);
