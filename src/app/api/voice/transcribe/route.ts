import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Voice transcription is not configured" }, { status: 503 });
  }

  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;
  if (!audio || audio.size === 0) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
    });
    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
