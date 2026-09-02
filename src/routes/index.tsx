import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Brain, Flame, Headphones, Languages, Timer, Trophy, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GyaanPath — Free GK & theory prep for UPSC, SSC, Banking, Railways" },
      {
        name: "description",
        content:
          "Learn general knowledge and theory in small, exam-oriented lessons. Free trial chapters, quizzes, XP, streaks, revision and a focus timer.",
      },
      { property: "og:title", content: "GyaanPath — Structured GK prep for Indian exams" },
      {
        property: "og:description",
        content: "Chapter-wise GK and theory lessons with quizzes, XP, leaderboards and audio in your language.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BookOpen, title: "Structured syllabus", body: "Exam to subject to section to chapter to lesson. Nothing is out of order." },
  { icon: Brain, title: "Micro-lessons + MCQs", body: "Six tight lessons per chapter, each with a four-question check." },
  { icon: Headphones, title: "Listen mode", body: "Any lesson read aloud, so revision fits into a commute." },
  { icon: Languages, title: "Your language", body: "English, Hindi and major regional languages on the same content." },
  { icon: Timer, title: "Pomodoro focus", body: "25-minute rounds that log study time and earn XP." },
  { icon: Trophy, title: "XP, streaks, ranks", body: "Badges and a live leaderboard keep the habit alive." },
];

function Landing() {
  const { user } = useAuth();

  return (
    <AppShell>
      <section className="py-10 text-center md:py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
          <Flame className="size-3.5 text-primary" /> Built for UPSC · SSC · Banking · Railways
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
          Learn GK and theory the way exams actually ask it.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Section-wise, chapter-wise lessons you can finish in five minutes — with quizzes, spaced revision,
          audio and progress tracking. Start free, unlock everything once.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={user ? "/learn" : "/auth"}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Start learning free
          </Link>
          <Link
            to="/pricing"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            See pricing
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <Icon className="size-5 text-primary" />
            <h2 className="mt-3 font-display text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
        <Wallet className="mx-auto size-5 text-primary" />
        <h2 className="mt-3 font-display text-xl font-bold text-foreground">
          Free to try, one small payment to unlock
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          The first chapters of every subject are free forever. Unlock the full library with a monthly,
          yearly or lifetime plan paid securely through Razorpay.
        </p>
        <Link
          to="/learn"
          className="mt-5 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Browse the syllabus
        </Link>
      </section>
    </AppShell>
  );
}
