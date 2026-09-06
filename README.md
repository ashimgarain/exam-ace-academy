# GyaanPath

A focused GK/theory learning platform for Indian competitive exams — UPSC, SSC, Banking, Railways, and more. Structured syllabus, bite-sized lessons, quizzes, revision cards, Pomodoro study timer, streaks, XP, leaderboards, and Razorpay-powered unlocks.

## What it does

- **Syllabus-first learning**: Exam → Subject → Section → Chapter → Lesson hierarchy.
- **AI-generated lessons**: Exam-oriented content, key points, memory hooks, and a 5-question quiz per lesson.
- **Multilingual + audio**: Read in 8 Indian languages and listen via text-to-speech.
- **Gamification**: XP, levels, streaks, badges, and all-India leaderboards.
- **Revision engine**: Spaced-repetition cards for anything you got wrong.
- **Pomodoro timer**: Log focused study sessions straight into your progress.
- **Freemium model**: First chapters are free; full access unlocks with Razorpay.

## Tech stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Lovable Cloud](https://lovable.dev) — backend, auth, and Postgres
- [Razorpay](https://razorpay.com) — payments
- [Lovable AI Gateway](https://docs.lovable.dev/ai-gateway) — lesson generation, translation, and TTS

## Local development

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

The dev server starts at `http://localhost:8080`.

## Environment variables

Lovable injects the Supabase and Lovable API keys automatically. To enable payments, add these secrets in your Lovable project settings:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Use Razorpay test keys for development.

## Project structure

```text
src/
  components/          # UI components (AppShell, PomodoroTimer, etc.)
  hooks/               # React hooks (useAuth, useLanguage)
  integrations/        # Supabase client and middleware (auto-generated)
  lib/                 # Server helpers, catalog, payments, AI, entitlements
  routes/              # TanStack Start routes
    _authenticated/    # Protected app screens
    api/public/        # Public webhooks
  styles.css           # Tailwind v4 theme tokens
```

## License

This codebase is yours. Built and maintained through Lovable.
