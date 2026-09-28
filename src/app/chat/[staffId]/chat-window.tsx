"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { VoiceInputButton } from "@/components/voice-input-button";
import type { Message } from "@/lib/data/messages";
import type { Staff } from "@/lib/data/types";

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function dateDivider(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ChatWindow({
  partner,
  myStaffId,
  initial,
}: {
  partner: Staff;
  myStaffId: string;
  initial: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [sending, startSending] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef(initial.at(-1)?.createdAt ?? "");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/chat/messages?with=${partner.id}&after=${encodeURIComponent(lastTimestampRef.current)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages?.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const fresh = (data.messages as Message[]).filter((m) => !ids.has(m.id));
            if (!fresh.length) return prev;
            lastTimestampRef.current = fresh.at(-1)!.createdAt;
            return [...prev, ...fresh];
          });
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [partner.id]);

  async function handleSend() {
    const msg = text.trim();
    if (!msg) return;
    setText("");
    startSending(async () => {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStaffId: partner.id, message: msg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message.id)) return prev;
          lastTimestampRef.current = data.message.createdAt;
          return [...prev, data.message];
        });
      }
    });
  }

  let lastDate = "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-400">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => {
          const mine = m.fromId === myStaffId;
          const dateLabel = dateDivider(m.createdAt);
          const showDate = dateLabel !== lastDate;
          lastDate = dateLabel;
          return (
            <div key={m.id}>
              {showDate && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] font-medium text-slate-400">{dateLabel}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <Avatar name={partner.name} size="sm" className="mb-1 shrink-0" />}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    mine
                      ? "rounded-br-sm bg-brand-navy text-white"
                      : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200/80"
                  }`}
                >
                  <p className="leading-relaxed">{m.message}</p>
                  <p className={`mt-1 text-right text-[10px] ${mine ? "text-slate-300" : "text-slate-400"}`}>
                    {timeLabel(m.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-background p-3">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${partner.name.split(" ")[0]}`}
            className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm placeholder:text-slate-400 focus:border-brand-navy focus:outline-none"
          />
          <VoiceInputButton onTranscribed={(t) => setText((prev) => (prev ? prev + " " + t : t))} />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            aria-label="Send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-white transition hover:bg-brand-navy-soft active:scale-95 disabled:opacity-40"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
