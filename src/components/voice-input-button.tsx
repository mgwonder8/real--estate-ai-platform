"use client";

import { useRef, useState } from "react";

type RecState = "idle" | "recording" | "transcribing" | "error";

export function VoiceInputButton({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [state, setState] = useState<RecState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError("Microphone not supported on this device/browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start();
      recorderRef.current = recorder;
      setState("recording");
    } catch {
      setState("error");
      setError("Microphone permission denied.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  async function handleStop() {
    setState("transcribing");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob, "voice.webm");

    try {
      const res = await fetch("/api/voice/transcribe", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed");
      onTranscribed(data.text as string);
      setState("idle");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Transcription failed");
    }
  }

  function handleClick() {
    if (state === "recording") {
      stopRecording();
    } else if (state === "idle" || state === "error") {
      startRecording();
    }
  }

  const label = state === "recording" ? "Stop" : state === "transcribing" ? "…" : "🎤";

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "transcribing"}
        title={state === "recording" ? "Stop recording" : "Record a voice command"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
          state === "recording"
            ? "bg-red-600 text-white animate-pulse"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
