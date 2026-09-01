const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export type LessonContent = {
  intro: string;
  keyPoints: string[];
  facts: { label: string; value: string }[];
  memoryHook: string;
  examNote: string;
  summary: string;
};

export type GeneratedLesson = {
  title: string;
  content: LessonContent;
  questions: {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  }[];
};

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project yet.");
  return key;
}

async function chatJson(prompt: string, system: string): Promise<unknown> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey(),
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please top up to keep generating lessons.");
    throw new Error(`Lesson generation failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  return JSON.parse(cleaned);
}

const SYSTEM = `You are a meticulous Indian competitive-exam faculty member (UPSC, SSC, Banking, Railways).
You write factually accurate, syllabus-tied, exam-oriented study notes in clean plain text.
Rules: no speculation, no opinions, no markdown symbols, no emojis. Prefer dates, names, numbers and
terms that are actually asked in previous year papers. Keep every sentence short and testable.
Always answer with valid JSON only.`;

export async function generateChapterLessons(input: {
  subject: string;
  section: string;
  chapter: string;
  summary: string;
  examNames: string;
}): Promise<GeneratedLesson[]> {
  const prompt = `Create a chapter of micro-lessons as JSON.

Exam context: ${input.examNames}
Subject: ${input.subject}
Section: ${input.section}
Chapter: ${input.chapter}
Chapter scope: ${input.summary}

Produce exactly 6 lessons that together cover the chapter scope in a logical order, with no overlap.
Return JSON of this exact shape:
{"lessons":[{"title":"short lesson title",
"content":{"intro":"2-3 sentence framing of the concept",
"keyPoints":["5 to 7 crisp exam-ready points"],
"facts":[{"label":"fact label","value":"precise value, date, name or number"}],
"memoryHook":"one mnemonic or memory trick",
"examNote":"how this is typically asked in the exam, with a previous-year style pointer",
"summary":"one sentence revision line"},
"questions":[{"question":"MCQ text","options":["A","B","C","D"],"correct_index":0,"explanation":"why the answer is right"}]}]}

Each lesson must have 4 to 7 keyPoints, 3 to 6 facts, and exactly 4 questions with 4 options each.
correct_index is the 0-based index of the correct option and must vary across questions.`;

  const parsed = (await chatJson(prompt, SYSTEM)) as { lessons?: GeneratedLesson[] };
  const lessons = parsed.lessons ?? [];
  if (!lessons.length) throw new Error("The generator returned no lessons. Please try again.");
  return lessons.slice(0, 8);
}

export const LANGUAGES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
  gu: "Gujarati",
  kn: "Kannada",
};

export async function translateLessonContent(
  content: LessonContent,
  language: string,
): Promise<LessonContent> {
  const name = LANGUAGES[language] ?? "Hindi";
  const prompt = `Translate the values of this study-note JSON into ${name}.
Keep the JSON keys and structure exactly the same. Keep proper nouns, dates, numbers and
established technical terms recognisable (transliterate rather than invent new words).
JSON:
${JSON.stringify(content)}`;

  return (await chatJson(prompt, SYSTEM)) as LessonContent;
}

export async function synthesizeSpeech(text: string): Promise<string> {
  const res = await fetch(`${GATEWAY}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-tts",
      input: text.slice(0, 3800),
      voice: "alloy",
      response_format: "mp3",
      stream_format: "audio",
      instructions: "Read clearly and calmly, like a patient exam tutor. Pause between points.",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Listen mode is busy. Try again in a minute.");
    if (res.status === 402) throw new Error("AI credits are exhausted, so audio is unavailable.");
    throw new Error(`Audio generation failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
