import { Link, useRouter } from "@tanstack/react-router";
import { BookOpen, Flame, LayoutDashboard, LogOut, Moon, Repeat2, Sun, Trophy, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
import { PomodoroTimer } from "@/components/PomodoroTimer";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/revise", label: "Revise", icon: Repeat2 },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
] as const;

export function AppShell({
  children,
  xp,
  streak,
}: {
  children: ReactNode;
  xp?: number | undefined;
  streak?: number | undefined;
}) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              ज्ञ
            </span>
            <span className="hidden font-display text-lg font-bold tracking-tight text-foreground sm:block">
              GyaanPath
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeProps={{ className: "bg-secondary text-foreground" }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {typeof streak === "number" && (
              <span className="hidden items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground sm:flex">
                <Flame className="size-3.5 text-primary" />
                {streak}
              </span>
            )}
            {typeof xp === "number" && (
              <span className="hidden items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground sm:flex">
                <Zap className="size-3.5 text-primary" />
                {xp} XP
              </span>
            )}
            <button
              onClick={toggle}
              className="rounded-lg border border-border p-2 text-muted-foreground transition hover:text-foreground"
              aria-label="Toggle day and night mode"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {user ? (
              <button
                onClick={signOut}
                className="rounded-lg border border-border p-2 text-muted-foreground transition hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            ) : (
              <Link
                to="/auth"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-16">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeProps={{ className: "text-primary" }}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>

      {user && <PomodoroTimer />}
    </div>
  );
}
