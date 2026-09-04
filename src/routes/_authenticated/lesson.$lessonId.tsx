import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Flag, Headphones, Loader2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getLesson, reportLesson, speakLesson, submitLesson } from "@/lib/learn.functions";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lesson — GyaanPath" },
      { name: "description", content: "A short, exam-oriented lesson with an instant quiz check." },
      { property: "og:title", content: "Lesson — GyaanPath" },
      { property: "og:description", content: "Learn a concept in five minutes, then test it immediately." },
    ],
  }),
  component: LessonPage,
});

type Content = {
  intro?: string;
  keyPoints?: string[];
  facts?: { label: string; value: string }[];
  memoryHook?: string;
  examNote?: string;
  summary?: string;
};

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["lesson", lessonId, language],
    queryFn: () => getLesson({ data: { lessonId, language } }),
  });

  const [stage, setStage] = useState<"read" | "quiz">("read");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitLesson>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const submit = useServerFn(submitLesson);
  const speak = useServerFn(speakLesson);
  const report = useServerFn(reportLesson);

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <p className="py-20 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Lesson unavailable."}
        </p>
      </AppShell>
    );
  }

  const content = data.lesson.content as Content;

  async function onListen() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    try {
      const { audio } = await speak({ data: { lessonId, language } });
      const el = new Audio(`data:audio/mpeg;base64,${audio}`);
      audioRef.current = el;
      el.onended = () => {
        audioRef.current = null;
        setSpeaking(false);
      };
      await el.play();
    } catch (err) {
      setSpeaking(false);
      toast.error(err instanceof Error ? err.message : "Could not play audio");
    }
  }

  async function onSubmit() {
    if (Object.keys(answers).length < data!.questions.length) {
      toast.error("Answer every question first.");
      return;
    }
    setBusy(true);
    try {
      const res = await submit({
        data: {
          lessonId,
          answers: Object.entries(answers).map(([questionId, choice]) => ({ questionId, choice })),
        },
      });
      setResult(res);
      toast.success(`+${res.xp} XP · ${res.score}/${res.total} correct`);
      res.newBadges.forEach((b) => toast(`Badge unlocked: ${b.name}`));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  async function onReport() {
    const note = window.prompt("What looks wrong in this lesson?");
    if (!note) return;
    await report({ data: { lessonId, note: note.slice(0, 500) } });
    toast.success("Thanks. We have flagged this lesson for review.");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/chapter/$chapterSlug"
            params={{ chapterSlug: data.chapter.slug }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {data.chapter.title}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground"
              aria-label="Reading language"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              onClick={onListen}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {speaking ? <Loader2 className="size-3.5 animate-spin" /> : <Headphones className="size-3.5" />}
              {speaking ? "Stop" : "Listen"}
            </button>
          </div>
        </div>

        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">{data.lesson.title}</h1>

        {stage === "read" && (
          <article className="mt-6 space-y-6">
            {content.intro && <p className="text-base leading-relaxed text-foreground">{content.intro}</p>}

            {!!content.keyPoints?.length && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Key points
                </h2>
                <ul className="mt-3 space-y-2">
                  {content.keyPoints.map((p, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-foreground">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!!content.facts?.length && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Facts to remember
                </h2>
                <dl className="mt-3 divide-y divide-border">
                  {content.facts.map((f, i) => (
                    <div key={i} className="flex gap-4 py-2 text-sm">
                      <dt className="w-2/5 shrink-0 text-muted-foreground">{f.label}</dt>
                      <dd className="font-medium text-foreground">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {content.memoryHook && (
              <section className="rounded-2xl border border-primary/40 bg-primary/10 p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">Memory hook</h2>
                <p className="mt-2 text-sm text-foreground">{content.memoryHook}</p>
              </section>
            )}

            {content.examNote && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  How it is asked
                </h2>
                <p className="mt-2 text-sm text-foreground">{content.examNote}</p>
              </section>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStage("quiz")}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                Take the check-in quiz
              </button>
              <button
                onClick={onReport}
                className="rounded-xl border border-border p-3 text-muted-foreground"
                aria-label="Report an error in this lesson"
              >
                <Flag className="size-4" />
              </button>
            </div>
          </article>
        )}

        {stage === "quiz" && (
          <div className="mt-6 space-y-5">
            {data.questions.map((q, qi) => {
              const options = (q.options as unknown as string[]) ?? [];
              const res = result?.results.find((r) => r.questionId === q.id);
              return (
                <div key={q.id} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold text-foreground">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="mt-3 space-y-2">
                    {options.map((opt, oi) => {
                      const chosen = answers[q.id] === oi;
                      const isRight = res && res.correctIndex === oi;
                      const isWrongPick = res && chosen && !res.correct;
                      return (
                        <button
                          key={oi}
                          disabled={Boolean(result)}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left text-sm transition",
                            isRight
                              ? "border-success bg-success/10 text-foreground"
                              : isWrongPick
                                ? "border-destructive bg-destructive/10 text-foreground"
                                : chosen
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {isRight && <CheckCircle2 className="size-4 text-success" />}
                          {isWrongPick && <XCircle className="size-4 text-destructive" />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {res?.explanation && (
                    <p className="mt-3 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                      {res.explanation}
                    </p>
                  )}
                </div>
              );
            })}

            {!result ? (
              <button
                onClick={onSubmit}
                disabled={busy}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Checking…" : "Submit answers"}
              </button>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5 text-center">
                <p className="font-display text-2xl font-bold text-foreground">
                  {result.score}/{result.total} correct
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  +{result.xp} XP · {result.streak} day streak
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {data.nextLessonId ? (
                    <button
                      onClick={() => {
                        navigate({
                          to: "/lesson/$lessonId",
                          params: { lessonId: data.nextLessonId! },
                        });
                        setStage("read");
                        setAnswers({});
                        setResult(null);
                      }}
                      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                    >
                      Next lesson
                    </button>
                  ) : (
                    <Link
                      to="/chapter/$chapterSlug"
                      params={{ chapterSlug: data.chapter.slug }}
                      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                    >
                      Chapter complete
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
