import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Lock, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getChapterBundle } from "@/lib/learn.functions";
import { useLanguage } from "@/hooks/useLanguage";

export const Route = createFileRoute("/_authenticated/chapter/$chapterSlug")({
  head: () => ({
    meta: [
      { title: "Chapter lessons — GyaanPath" },
      { name: "description", content: "Work through short, exam-oriented lessons in this chapter." },
      { property: "og:title", content: "Chapter lessons — GyaanPath" },
      { property: "og:description", content: "Bite-sized lessons with quizzes for Indian competitive exams." },
    ],
  }),
  component: ChapterPage,
});

function ChapterPage() {
  const { chapterSlug } = Route.useParams();
  const { language } = useLanguage();

  const { data, isLoading, error } = useQuery({
    queryKey: ["chapter", chapterSlug, language],
    queryFn: () => getChapterBundle({ data: { chapterSlug, language } }),
    staleTime: 60_000,
  });

  return (
    <AppShell>
      {isLoading && (
        <div className="py-16 text-center">
          <Sparkles className="mx-auto size-6 animate-pulse text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Preparing this chapter. First open takes a few seconds while the lessons are written.
          </p>
        </div>
      )}

      {error && (
        <p className="py-16 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load this chapter."}
        </p>
      )}

      {data && (
        <>
          <Link to="/learn" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to syllabus
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold text-foreground">{data.chapter.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.subject?.name} · {data.section?.name} · {data.chapter.est_minutes} min
          </p>
          {data.chapter.summary && (
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{data.chapter.summary}</p>
          )}

          {data.locked ? (
            <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
              <Lock className="mx-auto size-6 text-primary" />
              <h2 className="mt-4 font-display text-xl font-bold text-foreground">
                This chapter is part of the full course
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                The first chapters of every subject stay free. Unlock everything — all subjects, listen mode,
                translations and the revision engine.
              </p>
              <Link
                to="/pricing"
                className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                See plans
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-2">
              {data.lessons.map((lesson, i) => (
                <Link
                  key={lesson.id}
                  to="/lesson/$lessonId"
                  params={{ lessonId: lesson.id }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 transition hover:bg-secondary"
                >
                  {lesson.completed ? (
                    <CheckCircle2 className="size-5 shrink-0 text-success" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {i + 1}. {lesson.title}
                    </span>
                    {lesson.completed && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Quiz score {lesson.score}/{lesson.total}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
