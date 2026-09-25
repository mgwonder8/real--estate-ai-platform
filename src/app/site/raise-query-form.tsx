"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { VoiceInputButton } from "@/components/voice-input-button";
import { raiseQueryAction } from "@/app/site/actions";
import { useGeolocation } from "@/lib/use-geolocation";

export function RaiseQueryForm() {
  const [message, setMessage] = useState("");
  const { lat, lng } = useGeolocation();

  return (
    <form
      action={async (fd) => {
        await raiseQueryAction(fd);
        setMessage("");
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="gpsLat" value={lat} />
      <input type="hidden" name="gpsLng" value={lng} />
      <input
        name="message"
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type or speak"
        className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 text-sm placeholder:text-slate-400 focus:border-brand-navy focus:outline-none"
      />
      <VoiceInputButton onTranscribed={(text) => setMessage(text)} />
      <button
        type="submit"
        aria-label="Send"
        disabled={!message.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white transition hover:bg-brand-navy-soft active:scale-95 disabled:opacity-40"
      >
        <SendHorizontal size={16} />
      </button>
    </form>
  );
}
