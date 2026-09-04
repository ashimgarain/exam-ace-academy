# GyaanPath — finish the build, then harden for launch

## Where the build stands

Done:
- Database: profiles, exams/subjects/sections/chapters/lessons, translations, quiz questions, progress, attempts, review queue, XP events, study sessions, badges, subscriptions, content reports — all with access rules. Indian History seeded section- and chapter-wise.
- Design system: dark-first "study desk" theme with amber accent, light mode, Sora/Manrope typography.
- App frame: theme toggle, auth state, top + bottom navigation, floating Pomodoro timer that logs study minutes and awards XP.
- Pages: landing, sign in / sign up (email + Google), syllabus browser with exam mode switching.
- Server logic: AI lesson generation per chapter (cached), translation into 8 languages (cached), text-to-speech, quiz grading, XP/streak/badge engine, spaced-repetition scheduling, Razorpay order creation and signature verification, paid-content gating checked on the server.

Blocker: the hosted database is paused, so one pending security change (locking lesson text and quiz answers to server-only reads) has not applied yet. It needs resuming before testing.

## Step 1 — Finish the core screens

- Onboarding: exam, target year, daily goal, language.
- Chapter page: lesson list, progress ticks, generate-on-first-open, locked state with upgrade prompt.
- Lesson player: content card (intro, key points, facts, memory hook, exam note), language switcher, Listen button, then the quiz with instant explanations, XP and badge celebration, next-lesson flow, "Report an error" button.
- Dashboard: streak, XP and level, subject-wise mastery bars, accuracy, study minutes, due-revision count, badges.
- Revise: daily spaced-repetition deck with remembered / forgot grading.
- Leaderboard: all-time and weekly, global and per-exam, own rank highlighted.
- Pricing: monthly / yearly / lifetime, Razorpay Checkout, unlock confirmation.

## Step 2 — Make it trustworthy and launch-ready

- Razorpay keys (test mode first) and a webhook endpoint so access activates even if the browser closes mid-payment.
- Resume the database and apply the pending content-locking change.
- Per-page SEO metadata so chapter pages get found in search.
- Content quality pass: reported lessons flagged for regeneration.

## Step 3 — What will actually make it stand out

Ranked by impact for Indian aspirants, to build after the core works:

1. **Daily Current Affairs brief** — a dated 10-point digest with a 5-question quiz, auto-generated each morning. This is the single biggest reason aspirants open an app daily, and the strongest retention and SEO engine.
2. **PYQ tagging** — mark each lesson with the exams and years the topic appeared in. "Asked 4 times in SSC CGL" is the credibility signal that separates a serious product from generic notes.
3. **Mock tests with all-India percentile** — timed sectional and full-length tests with rank. This is the main thing aspirants pay for.
4. **Weak-area engine** — the app tells you your three weakest chapters this week and builds today's plan from them, instead of leaving you to guess.
5. **One-page revision sheets** — auto-generated chapter cheat sheets, printable. Highly shareable, and a natural paid perk.
6. **Streak insurance and study squads** — a freeze token and small friend leaderboards; group accountability drives retention far more than solo streaks.
7. **Offline lesson caching and audio download** — a lot of study happens on patchy mobile data during commutes.
8. **Referral unlock** — invite three friends to extend access. Cheap growth for a price-sensitive audience.

On monetisation: keep a genuinely useful free tier (free chapters, current affairs, timer, streaks) and price the unlock low enough for a student — an annual plan around the price of one coaching handout converts far better than a high lifetime price. Mock tests and revision sheets are the strongest paid hooks.

## Step 4 — GitHub

When the build is done, connect the project to GitHub from the workspace Git settings; every later change syncs to the repository automatically. Payment keys and database credentials stay in the secret store, never in the repository.

## Technical notes

- Lesson text, translations and quiz answers are served only through the server after an entitlement check, so paid content cannot be read from the browser.
- AI generation is cached in the database on first request, so cost is paid once per chapter and every later learner reads the same reviewed copy.
- Razorpay payments are verified by signature on the server, with a webhook as the fallback path.
