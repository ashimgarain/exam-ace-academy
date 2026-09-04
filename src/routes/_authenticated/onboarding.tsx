import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { getExams } from "@/lib/catalog.functions";
import { saveOnboarding } from "@/lib/learn.functions";
import { LANGUAGE_OPTIONS } from "@/lib/languages";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your study plan — GyaanPath" },
      { name: "description", content: "Choose your exam, target year, daily goal and language." },
      { property: "og:title", content: "Set up your study plan — GyaanPath" },
      { property: "og:description", content: "Personalise your exam preparation in under a minute." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const save = useServerFn(saveOnboarding);
  const { data: exams } = useQuery({ queryKey: ["exams"], queryFn: () => getExams() });

  const [name, setName] = useState("");
  const [exam, setExam] = useState("upsc");
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [goal, setGoal] = useState(60);
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await save({
        data: {
          display_name: name.trim() || "Aspirant",
          exam_slug: exam,
          target_year: year,
          daily_goal_minutes: goal,
          language,
        },
      });
      toast.success("Your plan is ready.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <form onSubmit={submit} className="mx-auto max-w-lg space-y-6 py-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Set up your plan</h1>
          <p className="mt-2 text-sm text-muted-foreground">Takes a minute. You can change all of it later.</p>
        </div>

        <Field label="What should we call you?">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Your name"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </Field>

        <Field label="Target exam">
          <div className="flex flex-wrap gap-2">
            {(exams ?? []).map((e) => (
              <button
                key={e.slug}
                type="button"
                onClick={() => setExam(e.slug)}
                className={
                  e.slug === exam
                    ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    : "rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
                }
              >
                {e.short_name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Target year">
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((offset) => {
              const y = new Date().getFullYear() + offset;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={
                    y === year
                      ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      : "rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
                  }
                >
                  {y}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label={`Daily goal — ${goal} minutes`}>
          <input
            type="range"
            min={15}
            max={240}
            step={15}
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </Field>

        <Field label="Reading language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Start learning"}
        </button>
      </form>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}
