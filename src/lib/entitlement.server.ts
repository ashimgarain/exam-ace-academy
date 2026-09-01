import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function isEntitled(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status, expires_at")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!data?.length) return false;
  const now = Date.now();
  return data.some((row) => !row.expires_at || new Date(row.expires_at).getTime() > now);
}

export async function canAccessChapter(userId: string, chapterSlug: string) {
  const { data: chapter } = await supabaseAdmin
    .from("chapters")
    .select("slug, title, summary, section_slug, is_free, est_minutes")
    .eq("slug", chapterSlug)
    .maybeSingle();

  if (!chapter) throw new Error("Chapter not found");
  const entitled = await isEntitled(userId);
  return { chapter, entitled, allowed: chapter.is_free || entitled };
}
