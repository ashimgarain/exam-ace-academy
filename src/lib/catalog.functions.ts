import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getExams = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("exams")
    .select("slug, name, short_name, description, sort_order")
    .order("sort_order");
  return data ?? [];
});

export const getSyllabus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ examSlug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: examSubjects } = await supabaseAdmin
      .from("exam_subjects")
      .select("subject_slug, weight")
      .eq("exam_slug", data.examSlug);

    const slugs = (examSubjects ?? []).map((s) => s.subject_slug);
    if (!slugs.length) return { subjects: [] };

    const [{ data: subjects }, { data: sections }] = await Promise.all([
      supabaseAdmin
        .from("subjects")
        .select("slug, name, description, icon, sort_order")
        .in("slug", slugs)
        .order("sort_order"),
      supabaseAdmin
        .from("sections")
        .select("slug, name, subject_slug, sort_order")
        .in("subject_slug", slugs)
        .order("sort_order"),
    ]);

    const { data: chapters } = await supabaseAdmin
      .from("chapters")
      .select("slug, title, summary, section_slug, is_free, est_minutes, sort_order")
      .in(
        "section_slug",
        (sections ?? []).map((s) => s.slug),
      )
      .order("sort_order");

    return {
      subjects: (subjects ?? []).map((subject) => ({
        ...subject,
        sections: (sections ?? [])
          .filter((s) => s.subject_slug === subject.slug)
          .map((section) => ({
            ...section,
            chapters: (chapters ?? []).filter((c) => c.section_slug === section.slug),
          })),
      })),
    };
  });
