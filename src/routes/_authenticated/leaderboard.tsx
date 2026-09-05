import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getLeaderboard } from "@/lib/learn.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — GyaanPath" },
      { name: "description", content: "See how you rank against other aspirants by XP and streak." },
      { property: "og:title", content: "Leaderboard — GyaanPath" },
      { property: "og:description", content: "Climb the ranks by studying every day." },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const { data } = useQuery({ queryKey: ["leaderboard"], queryFn: () => getLeaderboard() });
  const rows = data?.all ?? [];
  const myRank = rows.findIndex((r) => r.id === data?.me) + 1;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-foreground">
          <Trophy className="size-7 text-primary" /> Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {myRank > 0
            ? `You are ranked #${myRank}, with ${data?.weeklyXp ?? 0} XP earned this week.`
            : `You have earned ${data?.weeklyXp ?? 0} XP this week. Finish a lesson to enter the ranks.`}
        </p>

        <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                row.id === data?.me && "bg-primary/10",
              )}
            >
              <span className="w-7 shrink-0 font-display text-sm font-bold text-muted-foreground">
                {i + 1}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {row.display_name}
                {row.exam_slug && (
                  <span className="ml-2 text-xs uppercase text-muted-foreground">{row.exam_slug}</span>
                )}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flame className="size-3.5 text-primary" />
                {row.streak_count}
              </span>
              <span className="w-20 text-right text-sm font-semibold text-foreground">{row.xp} XP</span>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No ranks yet. Be the first.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
