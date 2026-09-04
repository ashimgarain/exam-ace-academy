
DROP POLICY IF EXISTS "free lesson titles readable" ON public.lessons;
DROP POLICY IF EXISTS "translations readable" ON public.lesson_translations;
DROP POLICY IF EXISTS "questions readable" ON public.quiz_questions;
REVOKE SELECT ON public.lessons FROM authenticated;
REVOKE SELECT ON public.lesson_translations FROM authenticated;
REVOKE SELECT ON public.quiz_questions FROM authenticated;
