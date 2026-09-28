"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { SendHorizontal, Loader2, Paperclip, X, FileText, Sparkles, CheckCircle2, ExternalLink } from "lucide-react";
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

function isImage(type: string) {
  return type.startsWith("image/");
}

interface Attachment {
  url: string;
  name: string;
  type: string;
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
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTimestampRef = useRef(initial.at(-1)?.createdAt ?? "");

  const isTaskCommand = text.trimStart().toLowerCase().startsWith("/task");

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

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/chat/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAttachment({ url: data.url, name: data.name, type: data.type });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleTaskCommand() {
    const instruction = text.trim().replace(/^\/task\s*/i, "").trim();
    if (!instruction) return;
    setTaskError(null);
    setCreatingTask(true);
    try {
      const res = await fetch("/api/chat/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStaffId: partner.id, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Task creation failed");
      setText("");
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.message.id)) return prev;
        lastTimestampRef.current = data.message.createdAt;
        return [...prev, data.message];
      });
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : "Task creation failed");
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleSend() {
    if (isTaskCommand) {
      await handleTaskCommand();
      return;
    }
    const msg = text.trim();
    if (!msg && !attachment) return;
    const pendingAttachment = attachment;
    setText("");
    setAttachment(null);
    startSending(async () => {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStaffId: partner.id,
          message: msg,
          attachment: pendingAttachment ?? undefined,
        }),
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
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">No messages yet. Say hi!</p>
            <p className="mx-auto mt-4 max-w-xs rounded-xl bg-brand-gold/10 px-3 py-2 text-[11px] text-brand-navy">
              <Sparkles size={11} className="mr-1 inline" />
              Tip: type <span className="font-mono font-semibold">/task</span> to assign a task from chat.
            </p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.fromId === myStaffId;
          const dateLabel = dateDivider(m.createdAt);
          const showDate = dateLabel !== lastDate;
          lastDate = dateLabel;
          const hasAttachment = !!m.attachmentUrl;
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
                  className={`max-w-[75%] overflow-hidden rounded-2xl text-sm shadow-sm ${
                    mine
                      ? "rounded-br-sm bg-brand-navy text-white"
                      : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200/80"
                  }`}
                >
                  {hasAttachment && isImage(m.attachmentType) && (
                    <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.attachmentUrl} alt={m.attachmentName} className="max-h-72 w-full object-cover" />
                    </a>
                  )}
                  {hasAttachment && !isImage(m.attachmentType) && (
                    <a
                      href={m.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2.5 px-3 py-2.5 ${
                        mine ? "border-b border-white/10" : "border-b border-slate-100"
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${mine ? "bg-white/15" : "bg-slate-100"}`}>
                        <FileText size={16} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <span className="block truncate text-sm font-medium">{m.attachmentName}</span>
                        <span className={`block text-[10px] ${mine ? "text-slate-300" : "text-slate-400"}`}>Tap to open</span>
                      </span>
                      <ExternalLink size={14} className="shrink-0 opacity-60" />
                    </a>
                  )}
                  {m.message && (
                    <div className="px-4 py-2.5">
                      <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                      <p className={`mt-1 text-right text-[10px] ${mine ? "text-slate-300" : "text-slate-400"}`}>
                        {timeLabel(m.createdAt)}
                      </p>
                    </div>
                  )}
                  {!m.message && (
                    <p className={`px-3 pb-2 text-right text-[10px] ${mine ? "text-slate-300" : "text-slate-400"}`}>
                      {timeLabel(m.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-background p-3">
        {attachment && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            {isImage(attachment.type) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attachment.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <FileText size={16} />
              </span>
            )}
            <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{attachment.name}</p>
            <button
              onClick={() => setAttachment(null)}
              aria-label="Remove attachment"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {uploadError && <p className="mb-2 text-xs text-red-600">{uploadError}</p>}
        {taskError && <p className="mb-2 text-xs text-red-600">{taskError}</p>}
        {isTaskCommand && !creatingTask && (
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-2.5 py-1 text-[11px] font-medium text-brand-navy">
            <Sparkles size={11} /> Task mode — press Enter to assign to {partner.name.split(" ")[0]}
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !!attachment}
            aria-label="Attach file"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 active:scale-95 disabled:opacity-40"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isTaskCommand ? "Describe the task..." : `Message ${partner.name.split(" ")[0]}`}
            className={`h-11 min-w-0 flex-1 rounded-2xl border bg-white px-4 text-sm placeholder:text-slate-400 focus:outline-none ${
              isTaskCommand ? "border-brand-gold focus:border-brand-gold" : "border-slate-200 focus:border-brand-navy"
            }`}
          />
          <VoiceInputButton onTranscribed={(t) => setText((prev) => (prev ? prev + " " + t : t))} />
          <button
            onClick={handleSend}
            disabled={(!text.trim() && !attachment) || sending || creatingTask}
            aria-label={isTaskCommand ? "Create task" : "Send"}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white transition active:scale-95 disabled:opacity-40 ${
              isTaskCommand ? "bg-brand-gold hover:brightness-105" : "bg-brand-navy hover:bg-brand-navy-soft"
            }`}
          >
            {sending || creatingTask ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isTaskCommand ? (
              <CheckCircle2 size={18} />
            ) : (
              <SendHorizontal size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Also link tasks referenced in confirmation messages
export function TaskLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="underline">{children}</Link>;
}
