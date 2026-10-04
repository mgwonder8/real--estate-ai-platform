import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";
import { isLocale } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const t = await getT();
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: t("common.notAuthenticated") }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: t("voice.notConfigured") }, { status: 503 });
  }

  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;
  if (!audio || audio.size === 0) {
    return NextResponse.json({ error: t("voice.noAudio") }, { status: 400 });
  }
  const spoken = formData.get("language");
  const language = isLocale(spoken) ? spoken : t.locale;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language,
    });
    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : t("voice.couldNot") },
      { status: 500 }
    );
  }
}
