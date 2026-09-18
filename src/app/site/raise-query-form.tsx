"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/voice-input-button";
import { raiseQueryAction } from "@/app/site/actions";
import { useGeolocation } from "@/lib/use-geolocation";

export function RaiseQueryForm() {
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const { lat, lng } = useGeolocation();

  return (
    <form
      ref={formRef}
      action={(fd) => {
        raiseQueryAction(fd);
        setMessage("");
      }}
      className="flex flex-col gap-2 px-5 py-4 sm:flex-row"
    >
      <input type="hidden" name="gpsLat" value={lat} />
      <input type="hidden" name="gpsLng" value={lng} />
      <input
        name="message"
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the issue…"
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
      />
      <VoiceInputButton onTranscribed={(text) => setMessage(text)} />
      <Button type="submit">Send</Button>
    </form>
  );
}
