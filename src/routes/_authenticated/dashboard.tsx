import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Clock, Flame, Repeat2, Target, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getDashboard } from "@/lib/learn.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your study dashboard — GyaanPath" },
      { name: "description", content: "Track your streak, XP, subject mastery, accuracy and study minutes." },
      { property: "og:title", content: "Your study dashboard — GyaanPath" },
      { property: "og:description", content: "See how your exam preparation is progressing week by week." },
    ],
  }),
  component: Dashboard,
});

function title(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Dashboard() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  const profile = data?.profile;
  const level = Math.floor((profile?.xp ?? 0) / 500) + 1;
  const intoLevel = (profile?.xp ?? 0) % 500;

  return (
    <AppShell xp={profile?.xp} streak={profile?.streak_count}>
      <h1 className="font-display text-3xl font-bold text-foreground">
        Namaste{profile?.display_name ? `, ${profile.display_name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {profile?.exam_slug ? `${profile.exam_slug.toUpperCase()} · target ${profile.target_year ?? "—"}` : "Set your exam in onboarding"}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flame} label="Day streak" value={profile?.streak_count ?? 0} />
        <Stat icon={Zap} label="Total XP" value={profile?.xp ?? 0} />
        <Stat icon={Target} label="Accuracy" value={`${data?.accuracy ?? 0}%`} />
        <Stat icon={Clock} label="Study minutes" value={data?.minutes ?? 0} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">Level {level}</span>
          <span className="text-muted-foreground">{intoLevel}/500 XP to next level</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${(intoLevel / 500) * 100}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold text-foreground">Subject mastery</h2>
          {Object.keys(data?.bySubject ?? {}).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Finish your first lesson and your mastery bars will appear here.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {Object.entries(data!.bySubject).map(([slug, s]) => {
                const pct = s.total ? Math.round((s.score / s.total) * 100) : 0;
                return (
                  <div key={slug}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{title(slug)}</span>
                      <span className="text-muted-foreground">
                        {pct}% · {s.lessons} lessons
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <Link
            to="/revise"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition hover:bg-secondary"
          >
            <Repeat2 className="size-6 text-primary" />
            <span>
              <span className="block font-semibold text-foreground">
                {data?.dueCount ?? 0} cards due for revision
              </span>
              <span className="block text-sm text-muted-foreground">
                Spaced repetition keeps what you learnt from slipping away.
              </span>
            </span>
          </Link>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <Award className="size-5 text-primary" /> Badges
            </h2>
            {data?.badges.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.badges.map((b) => (
                  <span
                    key={b.badge_slug}
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    {title(b.badge_slug)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No badges yet — your first lesson earns one.</p>
            )}
          </div>
        </section>
      </div>

      <Link
        to="/learn"
        className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Continue studying
      </Link>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
