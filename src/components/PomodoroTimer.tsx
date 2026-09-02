import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { logStudySession } from "@/lib/learn.functions";
import { cn } from "@/lib/utils";

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

export function PomodoroTimer() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [seconds, setSeconds] = useState(FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const logSession = useServerFn(logStudySession);
  const finishing = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (seconds > 0 || finishing.current) return;
    finishing.current = true;
    setRunning(false);

    if (mode === "focus") {
      setRounds((r) => r + 1);
      logSession({ data: { minutes: FOCUS_MINUTES } })
        .then((res) => toast.success(`Focus round done. +${res.xp} XP`))
        .catch(() => toast.success("Focus round done. Take a break."));
      setMode("break");
      setSeconds(BREAK_MINUTES * 60);
    } else {
      toast("Break over. Ready for another round?");
      setMode("focus");
      setSeconds(FOCUS_MINUTES * 60);
    }
    finishing.current = false;
  }, [seconds, mode, logSession]);

  const total = (mode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60;
  const pct = Math.max(0, Math.min(100, ((total - seconds) / total) * 100));
  const label = `${String(Math.max(0, Math.floor(seconds / 60))).padStart(2, "0")}:${String(
    Math.max(0, seconds % 60),
  ).padStart(2, "0")}`;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
        aria-label="Open focus timer"
      >
        <Timer className="size-4" />
        {running ? label : "Focus"}
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-64 rounded-2xl border border-border bg-card p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {mode === "focus" ? "Focus session" : "Short break"}
        </span>
        <button onClick={() => setOpen(false)} aria-label="Close timer">
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>

      <p className="mt-3 font-display text-4xl font-bold tabular-nums text-foreground">{label}</p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", mode === "focus" ? "bg-primary" : "bg-success")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setSeconds((mode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60);
          }}
          className="rounded-lg border border-border p-2 text-muted-foreground"
          aria-label="Reset timer"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">Rounds today: {rounds}</p>
    </div>
  );
}
