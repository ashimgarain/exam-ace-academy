import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getRevisionDeck, markRevised } from "@/lib/learn.functions";

export const Route = createFileRoute("/_authenticated/revise")({
  head: () => ({
    meta: [
      { title: "Daily revision deck — GyaanPath" },
      { name: "description", content: "Spaced-repetition cards bring back what you are about to forget." },
      { property: "og:title", content: "Daily revision deck — GyaanPath" },
      { property: "og:description", content: "Revise today's due cards in a few minutes." },
    ],
  }),
  component: Revise,
});

function Revise() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["revision"], queryFn: () => getRevisionDeck() });
  const mark = useServerFn(markRevised);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const cards = data?.cards ?? [];
  const card = cards[index];

  async function grade(remembered: boolean) {
    if (!card) return;
    await mark({ data: { lessonId: card.id, remembered } });
    setRevealed(false);
    setIndex((i) => i + 1);
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl font-bold text-foreground">Revision deck</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cards you got wrong or finished a while ago come back exactly when you are about to forget them.
        </p>

        {isLoading && <p className="mt-10 text-center text-sm text-muted-foreground">Loading your deck…</p>}

        {!isLoading && !card && (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto size-6 text-success" />
            <p className="mt-3 font-semibold text-foreground">
              {cards.length ? "Deck cleared for today." : "Nothing due right now."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Finish more lessons and they will queue up here automatically.
            </p>
            <Link
              to="/learn"
              className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Go to lessons
            </Link>
          </div>
        )}

        {card && (
          <>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Card {index + 1} of {cards.length}
            </p>
            <div className="mt-3 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold text-foreground">{card.title}</h2>

              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="mt-6 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground"
                >
                  Recall it, then reveal
                </button>
              ) : (
                <>
                  {card.summary && <p className="mt-4 text-sm text-foreground">{card.summary}</p>}
                  <ul className="mt-4 space-y-2">
                    {card.keyPoints.map((p, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-foreground">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => grade(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground"
                    >
                      <RotateCcw className="size-4" /> Show again
                    </button>
                    <button
                      onClick={() => grade(true)}
                      className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                    >
                      I remembered
                    </button>
                  </div>
                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: card.id }}
                    className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    Open the full lesson
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
