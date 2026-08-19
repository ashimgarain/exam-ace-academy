# ExamPrep Learning Platform

A free-to-start, exam-oriented GK and theory learning app for UPSC/State PSC, SSC, Banking and Railways aspirants — structured syllabus, bite-sized lessons, quizzes, XP, leaderboards, Pomodoro timer, listen-mode audio, multi-language reading, and a paid unlock via Razorpay.

## Core experience

1. **Onboarding** — pick exam(s), target year, daily study goal, preferred language.
2. **Exam mode** — the whole app filters to the selected exam: syllabus, subjects, chapters, quizzes and leaderboard are all exam-scoped. Switchable anytime.
3. **Syllabus tree** — Exam > Subject (Indian History, Polity, Geography, Economy, Science, Current Affairs) > Section (Ancient / Medieval / Modern India) > Chapter > Lessons.
4. **Lesson flow** — each chapter breaks into 5–8 short lessons. A lesson is a scrollable card: key concept, exam-relevant facts, a memory hook, a PYQ-style note, then a 3–5 question check-in quiz. Finishing awards XP and marks progress.
5. **Revision engine** — spaced repetition: wrong answers and completed lessons enter a review queue surfaced as a daily Revision deck. This is what makes it actually effective for exams.
6. **Listen mode** — text-to-speech reads any lesson aloud with play/pause and speed control, for revising while commuting.
7. **Language mode** — lessons render in English, Hindi, or a regional language (Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada); audio follows the chosen language.
8. **Pomodoro timer** — floating 25/5 study timer with session logging; study minutes feed stats and XP.
9. **Gamification** — XP per lesson/quiz/revision, levels, daily streaks, badges, weekly and all-time leaderboards (global and per-exam).
10. **Progress dashboard** — subject-wise mastery bars, accuracy, weak chapters, streak calendar, total study time.

## Content approach

Lessons are AI-generated per chapter on first request, then cached in the database so every later user gets the same reviewed copy — consistent quality, low cost. Generation uses a strict exam-oriented prompt (factual, syllabus-tied, no speculation) with a structured schema so every lesson has the same shape. Translations and audio are generated on demand and cached the same way. Each lesson has a "Report an error" button; reported lessons are flagged for regeneration — the honest way to keep content accurate at scale.

## Free vs paid

- Free: first 2 chapters of each subject, their quizzes, Pomodoro, streaks, leaderboard.
- Paid: full syllabus across all exams, unlimited listen mode, translations, revision engine, downloadable notes.
- Plans: one-time lifetime unlock and a monthly subscription, both through Razorpay Checkout.

## Design

Dark-first "study desk" aesthetic with a warm amber accent plus a clean light mode, toggleable and remembered per user. Mobile-first — the primary use case is a phone during a coaching-class break. A distinct typographic voice, not a generic dashboard look.

## Build order

1. Backend + auth (email/password and Google sign-in), theme system, design tokens, onboarding.
2. Syllabus model + browsing UI, seeded with the Indian History syllabus (Ancient/Medieval/Modern, section- and chapter-wise) plus skeletons for the other subjects.
3. Lesson generation, lesson player, quizzes, XP and progress tracking.
4. Pomodoro, streaks, badges, leaderboard, dashboard.
5. Text-to-speech listen mode and multi-language rendering.
6. Razorpay paywall, plans, and unlock gating.

## Technical notes

- Lovable Cloud provides Postgres, auth and storage. Tables: profiles, exams, subjects, sections, chapters, lessons, lesson_translations, quiz_questions, user_progress, quiz_attempts, review_queue, xp_events, study_sessions, badges, user_badges, subscriptions, content_reports. Roles live in a separate user_roles table with a security-definer has_role() function; RLS on every table so users read only their own progress and paid content is gated server-side.
- Lesson generation, translation and quiz generation run through Lovable AI in server functions with structured output schemas; results cached in the database.
- Text-to-speech runs server-side and streams audio; generated audio is cached in storage keyed by lesson + language so repeat plays cost nothing.
- **Razorpay**: Lovable's one-click payments cover Stripe and Paddle, not Razorpay. Razorpay is still fully doable — it needs your Razorpay Key ID and Key Secret stored as secrets, then order creation and signature verification in server functions plus a webhook at a public endpoint to activate access. You need a Razorpay account with KYC completed for live payments; test mode works immediately.
- Entitlement is always checked server-side before returning paid content, never in the browser.
- Every page gets its own SEO metadata so chapter pages are discoverable in search — a major free growth channel for this kind of site.

## Not in this first build

Live mock-test series with all-India ranking, PDF note exports, discussion forums, and a mobile app wrapper. Natural next steps once the core is solid.