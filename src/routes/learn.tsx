import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, Lock, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getExams, getSyllabus } from "@/lib/catalog.functions";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Syllabus — GK & theory chapters | GyaanPath" },
      {
        name: "description",
        content:
          "Browse the full exam syllabus: subjects, sections and chapters for UPSC, SSC, Banking and Railways preparation.",
      },
      { property: "og:title", content: "Exam syllabus — GyaanPath" },
      {
        property: "og:description",
        content: "Subject and chapter-wise structure for Indian competitive exam preparation.",
      },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const [exam, setExam] = useState("upsc");
  const { data: exams } = useQuery({ queryKey: ["exams"], queryFn: () => getExams() });
  const { data: syllabus, isLoading } = useQuery({
    queryKey: ["syllabus", exam],
    queryFn: () => getSyllabus({ data: { examSlug: exam } }),
  });

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold text-foreground">Syllabus</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick your exam mode, then work down a subject section by section.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {(exams ?? []).map((e) => (
          <button
            key={e.slug}
            onClick={() => setExam(e.slug)}
            className={
              e.slug === exam
                ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                : "rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {e.short_name}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading syllabus…</p>}

      <div className="mt-6 space-y-4">
        {(syllabus?.subjects ?? []).map((subject) => (
          <SubjectCard key={subject.slug} subject={subject} />
        ))}
      </div>
    </AppShell>
  );
}

type Subject = NonNullable<Awaited<ReturnType<typeof getSyllabus>>["subjects"]>[number];

function SubjectCard({ subject }: { subject: Subject }) {
  const [open, setOpen] = useState(false);
  const chapters = subject.sections.reduce((n, s) => n + s.chapters.length, 0);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-5 text-left">
        <div className="flex-1">
          <h2 className="font-display text-lg font-semibold text-foreground">{subject.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {subject.sections.length} sections · {chapters} chapters
          </p>
        </div>
        <ChevronDown
          className={`size-5 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-border p-5">
          {subject.sections.map((section) => (
            <div key={section.slug}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.name}
              </h3>
              <div className="mt-2 space-y-1.5">
                {section.chapters.map((chapter) => (
                  <Link
                    key={chapter.slug}
                    to="/chapter/$chapterSlug"
                    params={{ chapterSlug: chapter.slug }}
                    className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3 transition hover:bg-secondary"
                  >
                    {chapter.is_free ? (
                      <PlayCircle className="size-4 shrink-0 text-primary" />
                    ) : (
                      <Lock className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 text-sm font-medium text-foreground">{chapter.title}</span>
                    <span className="text-xs text-muted-foreground">{chapter.est_minutes} min</span>
                  </Link>
                ))}
                {!section.chapters.length && (
                  <p className="text-sm text-muted-foreground">Chapters coming soon.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
