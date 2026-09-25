"use client";

import { useRef, useState } from "react";
import { AudioLines, Loader2, Square } from "lucide-react";

type RecState = "idle" | "recording" | "transcribing" | "error";

export function VoiceInputButton({
  onTranscribed,
  size = "md",
}: {
  onTranscribed: (text: string) => void;
  size?: "md" | "lg";
}) {
  const [state, setState] = useState<RecState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError("Voice not supported on this device.");
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
      if (!res.ok) throw new Error(data.error || "Could not understand that. Try again.");
      onTranscribed(data.text as string);
      setState("idle");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Could not understand that. Try again.");
    }
  }

  function handleClick() {
    if (state === "recording") stopRecording();
    else if (state === "idle" || state === "error") startRecording();
  }

  const dim = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const recording = state === "recording";

  return (
    <div className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "transcribing"}
        aria-label={recording ? "Stop recording" : "Speak your task"}
        title={recording ? "Tap to stop" : "Speak"}
        className={`relative flex ${dim} cursor-pointer items-center justify-center rounded-xl transition active:scale-95 ${
          recording
            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        {recording && <span className="absolute inset-0 animate-ping rounded-xl bg-red-400/40" />}
        {state === "transcribing" ? (
          <Loader2 size={18} className="animate-spin" />
        ) : recording ? (
          <Square size={14} fill="currentColor" className="relative" />
        ) : (
          <AudioLines size={19} />
        )}
      </button>
      {recording && (
        <span className="pointer-events-none absolute -top-7 left-1/2 flex h-5 -translate-x-1/2 items-end gap-0.5 rounded-full bg-red-500 px-2 py-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-0.5 origin-bottom rounded-full bg-white"
              style={{ height: "100%", animation: `voice-bar 0.9s ease-in-out ${i * 0.12}s infinite` }}
            />
          ))}
        </span>
      )}
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1 w-52 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
