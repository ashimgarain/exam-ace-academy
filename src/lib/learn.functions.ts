import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const chapterInput = z.object({ chapterSlug: z.string().min(1), language: z.string().default("en") });
const lessonInput = z.object({ lessonId: z.string().uuid(), language: z.string().default("en") });

export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    const { isEntitled } = await import("./entitlement.server");
    return { profile: data, entitled: await isEntitled(context.userId) };
  });

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        display_name: z.string().min(1).max(40),
        exam_slug: z.string().min(1),
        target_year: z.number().int().min(2026).max(2035),
        daily_goal_minutes: z.number().int().min(10).max(240),
        language: z.string().min(2).max(5),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ ...data, onboarded: true })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updatePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ exam_slug: z.string().optional(), language: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getChapterBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => chapterInput.parse(input))
  .handler(async ({ data, context }) => {
    const { canAccessChapter } = await import("./entitlement.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { generateChapterLessons } = await import("./ai.server");

    const { chapter, allowed, entitled } = await canAccessChapter(context.userId, data.chapterSlug);

    const { data: section } = await supabaseAdmin
      .from("sections")
      .select("slug, name, subject_slug")
      .eq("slug", chapter.section_slug)
      .maybeSingle();
    const { data: subject } = await supabaseAdmin
      .from("subjects")
      .select("slug, name")
      .eq("slug", section?.subject_slug ?? "")
      .maybeSingle();

    if (!allowed) {
      return { chapter, section, subject, entitled, locked: true as const, lessons: [] };
    }

    let { data: lessons } = await supabaseAdmin
      .from("lessons")
      .select("id, title, sort_order")
      .eq("chapter_slug", chapter.slug)
      .order("sort_order");

    if (!lessons?.length) {
      const generated = await generateChapterLessons({
        subject: subject?.name ?? "General Studies",
        section: section?.name ?? "",
        chapter: chapter.title,
        summary: chapter.summary ?? "",
        examNames: "UPSC/State PSC, SSC CGL/CHSL, IBPS/SBI Banking, RRB Railways",
      });

      for (let i = 0; i < generated.length; i++) {
        const lesson = generated[i]!;
        const { data: inserted, error } = await supabaseAdmin
          .from("lessons")
          .insert({
            chapter_slug: chapter.slug,
            sort_order: i + 1,
            title: lesson.title,
            content: lesson.content as unknown as Record<string, unknown>,
          })
          .select("id")
          .single();
        if (error || !inserted) continue;
        const questions = (lesson.questions ?? []).slice(0, 6).map((q, qi) => ({
          lesson_id: inserted.id,
          sort_order: qi + 1,
          question: q.question,
          options: q.options as unknown as Record<string, unknown>,
          correct_index: Math.max(0, Math.min(q.options.length - 1, q.correct_index ?? 0)),
          explanation: q.explanation ?? null,
        }));
        if (questions.length) await supabaseAdmin.from("quiz_questions").insert(questions);
      }

      const refreshed = await supabaseAdmin
        .from("lessons")
        .select("id, title, sort_order")
        .eq("chapter_slug", chapter.slug)
        .order("sort_order");
      lessons = refreshed.data ?? [];
    }

    const { data: progress } = await context.supabase
      .from("user_progress")
      .select("lesson_id, score, total")
      .eq("chapter_slug", chapter.slug);

    const done = new Map((progress ?? []).map((p) => [p.lesson_id, p]));

    return {
      chapter,
      section,
      subject,
      entitled,
      locked: false as const,
      lessons: (lessons ?? []).map((l) => ({
        ...l,
        completed: done.has(l.id),
        score: done.get(l.id)?.score ?? 0,
        total: done.get(l.id)?.total ?? 0,
      })),
    };
  });

export const getLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => lessonInput.parse(input))
  .handler(async ({ data, context }) => {
    const { canAccessChapter } = await import("./entitlement.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { translateLessonContent } = await import("./ai.server");

    const { data: lesson } = await supabaseAdmin
      .from("lessons")
      .select("id, title, chapter_slug, sort_order, content")
      .eq("id", data.lessonId)
      .maybeSingle();
    if (!lesson) throw new Error("Lesson not found");

    const { chapter, allowed } = await canAccessChapter(context.userId, lesson.chapter_slug);
    if (!allowed) throw new Error("This chapter is part of the full course.");

    let content = lesson.content as Record<string, unknown>;
    if (data.language !== "en") {
      const { data: existing } = await supabaseAdmin
        .from("lesson_translations")
        .select("content")
        .eq("lesson_id", lesson.id)
        .eq("language", data.language)
        .maybeSingle();
      if (existing) {
        content = existing.content as Record<string, unknown>;
      } else {
        const translated = await translateLessonContent(content as never, data.language);
        await supabaseAdmin.from("lesson_translations").insert({
          lesson_id: lesson.id,
          language: data.language,
          content: translated as unknown as Record<string, unknown>,
        });
        content = translated as unknown as Record<string, unknown>;
      }
    }

    const { data: questions } = await supabaseAdmin
      .from("quiz_questions")
      .select("id, question, options, sort_order")
      .eq("lesson_id", lesson.id)
      .order("sort_order");

    const { data: siblings } = await supabaseAdmin
      .from("lessons")
      .select("id, sort_order")
      .eq("chapter_slug", lesson.chapter_slug)
      .order("sort_order");

    const index = (siblings ?? []).findIndex((s) => s.id === lesson.id);

    const { data: progress } = await context.supabase
      .from("user_progress")
      .select("score, total")
      .eq("lesson_id", lesson.id)
      .maybeSingle();

    return {
      lesson: { id: lesson.id, title: lesson.title, content },
      chapter,
      questions: questions ?? [],
      nextLessonId: siblings?.[index + 1]?.id ?? null,
      prevLessonId: index > 0 ? (siblings?.[index - 1]?.id ?? null) : null,
      alreadyCompleted: Boolean(progress),
    };
  });

export const submitLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        lessonId: z.string().uuid(),
        answers: z.array(z.object({ questionId: z.string().uuid(), choice: z.number().int().min(0) })),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { canAccessChapter } = await import("./entitlement.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lesson } = await supabaseAdmin
      .from("lessons")
      .select("id, chapter_slug")
      .eq("id", data.lessonId)
      .maybeSingle();
    if (!lesson) throw new Error("Lesson not found");
    const { allowed } = await canAccessChapter(context.userId, lesson.chapter_slug);
    if (!allowed) throw new Error("This chapter is part of the full course.");

    const { data: questions } = await supabaseAdmin
      .from("quiz_questions")
      .select("id, correct_index, explanation")
      .eq("lesson_id", lesson.id);

    const key = new Map((questions ?? []).map((q) => [q.id, q]));
    const results = data.answers.map((a) => {
      const q = key.get(a.questionId);
      return {
        questionId: a.questionId,
        correct: q ? q.correct_index === a.choice : false,
        correctIndex: q?.correct_index ?? 0,
        explanation: q?.explanation ?? "",
      };
    });
    const score = results.filter((r) => r.correct).length;
    const total = results.length || (questions?.length ?? 0);

    await context.supabase.from("quiz_attempts").insert(
      results.map((r) => ({
        user_id: context.userId,
        lesson_id: lesson.id,
        question_id: r.questionId,
        is_correct: r.correct,
      })),
    );

    const { data: chapterRow } = await supabaseAdmin
      .from("chapters")
      .select("section_slug")
      .eq("slug", lesson.chapter_slug)
      .maybeSingle();
    const { data: sectionRow } = await supabaseAdmin
      .from("sections")
      .select("subject_slug")
      .eq("slug", chapterRow?.section_slug ?? "")
      .maybeSingle();

    const { data: existing } = await context.supabase
      .from("user_progress")
      .select("id")
      .eq("lesson_id", lesson.id)
      .maybeSingle();

    await context.supabase.from("user_progress").upsert(
      {
        user_id: context.userId,
        lesson_id: lesson.id,
        chapter_slug: lesson.chapter_slug,
        subject_slug: sectionRow?.subject_slug ?? "general",
        score,
        total,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );

    // Spaced repetition: sooner when the score is weak.
    const interval = score === total && total > 0 ? 4 : score * 2 >= total ? 2 : 1;
    await context.supabase.from("review_queue").upsert(
      {
        user_id: context.userId,
        lesson_id: lesson.id,
        interval_days: interval,
        repetitions: 1,
        due_at: new Date(Date.now() + interval * 86400000).toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );

    const xp = existing ? 5 : 20 + score * 5;
    await context.supabase.from("xp_events").insert({
      user_id: context.userId,
      amount: xp,
      reason: existing ? "revision" : "lesson_complete",
    });

    const { earned, profile } = await applyXpAndStreak(context, xp);

    return { results, score, total, xp, streak: profile?.streak_count ?? 0, newBadges: earned };
  });

type AuthedContext = {
  supabase: import("@supabase/supabase-js").SupabaseClient<
    import("@/integrations/supabase/types").Database
  >;
  userId: string;
};

async function applyXpAndStreak(ctx: AuthedContext, xp: number) {
  const { supabase } = ctx;

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, streak_count, last_active_date")
    .eq("id", ctx.userId)
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = profile?.streak_count ?? 0;
  if (profile?.last_active_date === today) {
    // streak already counted today
  } else if (profile?.last_active_date === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  const newXp = (profile?.xp ?? 0) + xp;
  await supabase
    .from("profiles")
    .update({ xp: newXp, streak_count: streak, last_active_date: today })
    .eq("id", ctx.userId);

  const { count: lessonCount } = await supabase
    .from("user_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.userId);
  const { count: focusCount } = await supabase
    .from("study_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .eq("kind", "focus");

  const { data: badges } = await supabase.from("badges").select("slug, name, kind, threshold, icon");
  const { data: owned } = await supabase.from("user_badges").select("badge_slug").eq("user_id", ctx.userId);
  const ownedSet = new Set((owned ?? []).map((b: { badge_slug: string }) => b.badge_slug));

  const stats: Record<string, number> = {
    xp: newXp,
    streak,
    lessons: lessonCount ?? 0,
    focus: focusCount ?? 0,
  };

  const earned: { slug: string; name: string; icon: string }[] = [];
  for (const badge of badges ?? []) {
    const b = badge as { slug: string; name: string; kind: string; threshold: number; icon: string };
    if (ownedSet.has(b.slug)) continue;
    if ((stats[b.kind] ?? 0) >= b.threshold) {
      await supabase.from("user_badges").insert({ user_id: ctx.userId, badge_slug: b.slug });
      earned.push({ slug: b.slug, name: b.name, icon: b.icon });
    }
  }

  return { earned, profile: { streak_count: streak, xp: newXp } };
}

export const logStudySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ minutes: z.number().int().min(1).max(120) }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("study_sessions")
      .insert({ user_id: context.userId, minutes: data.minutes, kind: "focus" });
    const xp = Math.round(data.minutes / 5) * 2;
    if (xp > 0) {
      await context.supabase.from("xp_events").insert({ user_id: context.userId, amount: xp, reason: "focus" });
      await applyXpAndStreak(context, xp);
    }
    return { ok: true, xp };
  });

export const getDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: progress }, { data: attempts }, { data: sessions }, { data: badges }] =
      await Promise.all([
        context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
        context.supabase.from("user_progress").select("subject_slug, score, total, completed_at"),
        context.supabase.from("quiz_attempts").select("is_correct"),
        context.supabase.from("study_sessions").select("minutes, created_at"),
        context.supabase.from("user_badges").select("badge_slug, earned_at"),
      ]);

    const { data: due } = await context.supabase
      .from("review_queue")
      .select("lesson_id")
      .lte("due_at", new Date().toISOString());

    const bySubject: Record<string, { lessons: number; score: number; total: number }> = {};
    for (const row of progress ?? []) {
      const s = (bySubject[row.subject_slug] ??= { lessons: 0, score: 0, total: 0 });
      s.lessons += 1;
      s.score += row.score;
      s.total += row.total;
    }

    const correct = (attempts ?? []).filter((a) => a.is_correct).length;

    return {
      profile,
      bySubject,
      lessonsDone: progress?.length ?? 0,
      accuracy: attempts?.length ? Math.round((correct / attempts.length) * 100) : 0,
      minutes: (sessions ?? []).reduce((sum, s) => sum + s.minutes, 0),
      dueCount: due?.length ?? 0,
      badges: badges ?? [],
      recentDays: (progress ?? []).map((p) => p.completed_at.slice(0, 10)),
    };
  });

export const getLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: all } = await context.supabase
      .from("profiles")
      .select("id, display_name, xp, streak_count, exam_slug")
      .order("xp", { ascending: false })
      .limit(50);

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: myWeek } = await context.supabase
      .from("xp_events")
      .select("amount")
      .gte("created_at", weekAgo);

    return {
      all: all ?? [],
      me: context.userId,
      weeklyXp: (myWeek ?? []).reduce((s, e) => s + e.amount, 0),
    };
  });

export const getRevisionDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: due } = await context.supabase
      .from("review_queue")
      .select("lesson_id, due_at, interval_days")
      .lte("due_at", new Date().toISOString())
      .order("due_at")
      .limit(20);

    if (!due?.length) return { cards: [] };

    const { data: lessons } = await supabaseAdmin
      .from("lessons")
      .select("id, title, content, chapter_slug")
      .in(
        "id",
        due.map((d) => d.lesson_id),
      );

    return {
      cards: (lessons ?? []).map((l) => ({
        id: l.id,
        title: l.title,
        chapterSlug: l.chapter_slug,
        summary: ((l.content as Record<string, unknown>)["summary"] as string) ?? "",
        keyPoints: ((l.content as Record<string, unknown>)["keyPoints"] as string[]) ?? [],
      })),
    };
  });

export const markRevised = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ lessonId: z.string().uuid(), remembered: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("review_queue")
      .select("interval_days, repetitions")
      .eq("lesson_id", data.lessonId)
      .maybeSingle();

    const interval = data.remembered ? Math.min((row?.interval_days ?? 1) * 2, 60) : 1;
    await context.supabase
      .from("review_queue")
      .update({
        interval_days: interval,
        repetitions: (row?.repetitions ?? 0) + 1,
        due_at: new Date(Date.now() + interval * 86400000).toISOString(),
      })
      .eq("lesson_id", data.lessonId);

    if (data.remembered) {
      await context.supabase.from("xp_events").insert({
        user_id: context.userId,
        amount: 5,
        reason: "revision",
      });
      await applyXpAndStreak(context, 5);
    }
    return { ok: true };
  });

export const reportLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ lessonId: z.string().uuid(), note: z.string().max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await context.supabase
      .from("content_reports")
      .insert({ user_id: context.userId, lesson_id: data.lessonId, note: data.note });
    await supabaseAdmin.from("lessons").update({ needs_review: true }).eq("id", data.lessonId);
    return { ok: true };
  });

export const speakLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => lessonInput.parse(input))
  .handler(async ({ data, context }) => {
    const { canAccessChapter } = await import("./entitlement.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { synthesizeSpeech } = await import("./ai.server");

    const { data: lesson } = await supabaseAdmin
      .from("lessons")
      .select("id, title, chapter_slug, content")
      .eq("id", data.lessonId)
      .maybeSingle();
    if (!lesson) throw new Error("Lesson not found");
    const { allowed } = await canAccessChapter(context.userId, lesson.chapter_slug);
    if (!allowed) throw new Error("This chapter is part of the full course.");

    let content = lesson.content as Record<string, unknown>;
    if (data.language !== "en") {
      const { data: t } = await supabaseAdmin
        .from("lesson_translations")
        .select("content")
        .eq("lesson_id", lesson.id)
        .eq("language", data.language)
        .maybeSingle();
      if (t) content = t.content as Record<string, unknown>;
    }

    const parts = [
      lesson.title,
      content["intro"] as string,
      ...(((content["keyPoints"] as string[]) ?? []).map((p) => p)),
      content["memoryHook"] as string,
      content["summary"] as string,
    ].filter(Boolean);

    const audio = await synthesizeSpeech(parts.join(". "));
    return { audio };
  });
