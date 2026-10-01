"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  SendHorizontal,
  Loader2,
  Paperclip,
  X,
  FileText,
  Sparkles,
  ExternalLink,
  ClipboardCheck,
  CalendarDays,
  Camera,
  FolderInput,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { VoiceInputButton } from "@/components/voice-input-button";
import type { Channel, Message } from "@/lib/data/messages";
import type { Staff } from "@/lib/data/types";

export type TaskOption = { id: string; title: string; status: string; deadline: string };

type Attachment = { url: string; name: string; type: string };
type Staged = { preview: string; name: string; type: string; uploaded: Attachment | null };
type ChatMessage = Message & { pending?: boolean };

const STATUS_LABEL: Record<string, string> = {
  pending: "To do",
  in_progress: "In progress",
  completed: "Awaiting approval",
  approved: "Done",
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
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

function prettyDate(ymd: string) {
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? ymd : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const isImage = (type: string) => type.startsWith("image/");
const isVideo = (type: string) => type.startsWith("video/");

/** Old confirmations were plain text; newer ones also carry taskId. */
function parseTaskConfirmation(msg: string): { title: string; due?: string } | null {
  const m = msg.match(/^(?:✅ )?Task assigned:\s*"(.+?)"(?:,?\s*(?:[—-]\s*)?due\s+(\S+))?$/);
  return m ? { title: m[1], due: m[2] } : null;
}

export function ChatWindow({
  partner,
  myStaffId,
  myRole,
  initial,
  taskIndex,
  taskOptions,
  defaultTaskId,
  channel = "team",
}: {
  partner: Staff;
  myStaffId: string;
  myRole: string;
  initial: Message[];
  taskIndex: Record<string, TaskOption>;
  taskOptions: TaskOption[];
  defaultTaskId: string;
  channel?: Channel;
}) {
  const isPersonal = channel === "personal";
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [tasksById, setTasksById] = useState(taskIndex);
  const [text, setText] = useState("");
  const [staged, setStaged] = useState<Staged | null>(null);
  const [saveTo, setSaveTo] = useState(defaultTaskId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTimestampRef = useRef(initial.at(-1)?.createdAt ?? "");

  const isStaff = myRole === "site_staff";
  const taskMode = !isStaff && !isPersonal && text.trimStart().toLowerCase().startsWith("/task");
  const firstName = partner.name.split(" ")[0];
  const taskHref = (id: string) => (isStaff ? "/site" : `/tasks/${id}`);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(
          `/api/chat/messages?with=${partner.id}&channel=${channel}&after=${encodeURIComponent(lastTimestampRef.current)}`
        );
        if (!res.ok || stopped) return;
        const data = (await res.json()) as { messages?: Message[] };
        if (data.messages?.length) addMessages(data.messages);
      } catch {}
    }
    const timer = setInterval(poll, 3000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [partner.id, channel]);

  function addMessages(fresh: Message[]) {
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const add = fresh.filter((m) => !ids.has(m.id));
      if (!add.length) return prev;
      const latest = add.reduce((a, m) => (m.createdAt > a ? m.createdAt : a), lastTimestampRef.current);
      lastTimestampRef.current = latest;
      return [...prev, ...add];
    });
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    const preview = isImage(file.type) || isVideo(file.type) ? URL.createObjectURL(file) : "";
    const type = file.type || "application/octet-stream";
    setStaged({ preview, name: file.name, type, uploaded: null });
    setSaveTo(defaultTaskId);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/chat/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStaged((s) => (s && s.name === file.name ? { ...s, uploaded: { url: data.url, name: data.name, type: data.type } } : s));
    } catch (err) {
      setStaged(null);
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function clearStaged() {
    if (staged?.preview) URL.revokeObjectURL(staged.preview);
    setStaged(null);
  }

  async function send() {
    if (busy) return;
    const body = text.trim();
    const attachment = staged?.uploaded ?? null;
    if (staged && !attachment) return;
    if (!body && !attachment) return;
    setError(null);

    if (taskMode) {
      const instruction = body.replace(/^\/task\s*/i, "").trim();
      if (!instruction) {
        setError("Write what needs to be done after /task");
        return;
      }
      setBusy(true);
      try {
        const res = await fetch("/api/chat/task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toStaffId: partner.id, instruction, attachment }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not create the task");
        setTasksById((prev) => ({ ...prev, [data.task.id]: data.task }));
        setText("");
        clearStaged();
        addMessages([data.message]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the task");
      } finally {
        setBusy(false);
      }
      return;
    }

    const linkTask = attachment ? saveTo : "";
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      fromId: myStaffId,
      toId: partner.id,
      message: body,
      attachmentUrl: staged?.preview || attachment?.url || "",
      attachmentName: attachment?.name ?? "",
      attachmentType: attachment?.type ?? "",
      createdAt: new Date().toISOString(),
      readAt: "",
      taskId: linkTask,
      channel,
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    const stagedCopy = staged;
    setStaged(null);
    inputRef.current?.focus();

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStaffId: partner.id, message: body, attachment, taskId: linkTask || undefined, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Message not sent");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      addMessages([data.message]);
      if (stagedCopy?.preview) URL.revokeObjectURL(stagedCopy.preview);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(body);
      setStaged(stagedCopy);
      setError(err instanceof Error ? err.message : "Message not sent");
    }
  }

  const uploading = !!staged && !staged.uploaded;
  const canSend = !busy && !uploading && (!!text.trim() || !!staged?.uploaded);
  const savedLabel = (fromMe: boolean, type: string) => {
    const senderIsStaff = fromMe ? isStaff : partner.role === "site_staff";
    return senderIsStaff && (isImage(type) || isVideo(type)) ? "Saved as proof" : "Saved as reference";
  };

  let lastDate = "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 sm:px-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <Avatar name={partner.name} size="lg" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              {isPersonal ? `Private chat with ${firstName}` : `Start chatting with ${firstName}`}
            </p>
            <p className="mt-1 flex max-w-xs items-center gap-1.5 text-xs text-slate-400">
              {isPersonal ? (
                <>
                  <Lock size={12} /> Only you and {firstName} can see this.
                </>
              ) : (
                "Photos and files you send can be saved straight to a task."
              )}
            </p>
            {!isStaff && !isPersonal && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-gold/10 px-3 py-1.5 text-xs text-brand-navy">
                <Sparkles size={12} className="text-brand-gold" />
                Type <span className="font-mono font-semibold">/task</span> to assign work
              </p>
            )}
          </div>
        )}

        {messages.map((m) => {
          const mine = m.fromId === myStaffId;
          const dateLabel = dateDivider(m.createdAt);
          const showDate = dateLabel !== lastDate;
          lastDate = dateLabel;
          const linked = m.taskId ? tasksById[m.taskId] : undefined;
          const conf = parseTaskConfirmation(m.message);

          return (
            <div key={m.id} className={m.pending ? "opacity-70" : ""}>
              {showDate && (
                <div className="flex justify-center py-2">
                  <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                    {dateLabel}
                  </span>
                </div>
              )}

              <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <Avatar name={partner.name} size="sm" className="mb-1" />}

                {conf ? (
                  <TaskCard
                    title={linked?.title ?? conf.title}
                    due={linked?.deadline || conf.due}
                    status={linked?.status}
                    href={m.taskId ? taskHref(m.taskId) : undefined}
                    attachment={m.attachmentUrl ? { url: m.attachmentUrl, name: m.attachmentName, type: m.attachmentType } : null}
                    time={timeLabel(m.createdAt)}
                  />
                ) : (
                  <div
                    className={`max-w-[80%] overflow-hidden rounded-2xl text-sm shadow-sm sm:max-w-[70%] ${
                      mine
                        ? "rounded-br-md bg-brand-navy text-white"
                        : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200/80"
                    }`}
                  >
                    {m.attachmentUrl && (
                      <AttachmentView
                        url={m.attachmentUrl}
                        name={m.attachmentName}
                        type={m.attachmentType}
                        mine={mine}
                      />
                    )}
                    {m.message && <p className="whitespace-pre-wrap break-words px-3.5 pt-2.5 leading-relaxed">{m.message}</p>}
                    {m.taskId && m.attachmentUrl && (
                      <Link
                        href={taskHref(m.taskId)}
                        className={`mx-2.5 mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                          mine ? "bg-white/10 text-slate-100 hover:bg-white/15" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <FolderInput size={12} className="shrink-0 text-brand-gold" />
                        <span className="truncate">
                          {savedLabel(mine, m.attachmentType)}: {linked?.title ?? "task"}
                        </span>
                      </Link>
                    )}
                    <p className={`px-3.5 pb-2 pt-1 text-right text-[10px] ${mine ? "text-slate-300" : "text-slate-400"}`}>
                      {m.pending ? "Sending..." : timeLabel(m.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-2.5 sm:p-3">
        {error && (
          <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </p>
        )}

        {staged && (
          <div className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <div className="flex items-center gap-2.5">
              {isImage(staged.type) && staged.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={staged.preview} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                  {isVideo(staged.type) ? <Camera size={20} /> : <FileText size={20} />}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{staged.name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  {uploading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Uploading
                    </>
                  ) : (
                    "Ready to send"
                  )}
                </p>
              </div>
              <button onClick={clearStaged} aria-label="Remove file" className="rounded-lg p-1.5 text-slate-400 hover:bg-white">
                <X size={16} />
              </button>
            </div>

            {!taskMode && taskOptions.length > 0 && (
              <label className="mt-2 flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 ring-1 ring-slate-200">
                <FolderInput size={15} className="shrink-0 text-brand-gold" />
                <span className="shrink-0 text-xs font-medium text-slate-600">
                  {isStaff && isImage(staged.type) ? "Save as proof for" : "Save to task"}
                </span>
                <select
                  value={saveTo}
                  onChange={(e) => setSaveTo(e.target.value)}
                  className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                >
                  <option value="">Don&apos;t save to a task</option>
                  {taskOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({STATUS_LABEL[t.status] ?? t.status})
                    </option>
                  ))}
                </select>
              </label>
            )}
            {taskMode && (
              <p className="mt-2 text-xs text-slate-500">This file will be attached to the new task as a reference.</p>
            )}
          </div>
        )}

        {taskMode && (
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-2.5 py-1 text-[11px] font-medium text-brand-navy">
            <Sparkles size={11} /> New task for {firstName}. Press Enter to assign.
          </p>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={pickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!staged || busy}
            aria-label="Attach photo or file"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 active:scale-95 disabled:opacity-40"
          >
            <Paperclip size={19} />
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={taskMode ? "What needs to be done?" : isPersonal ? `Private message to ${firstName}` : `Message ${firstName}`}
            className={`h-11 min-w-0 flex-1 rounded-2xl border bg-slate-50 px-4 text-[15px] placeholder:text-slate-400 focus:bg-white focus:outline-none ${
              taskMode ? "border-brand-gold" : "border-slate-200 focus:border-brand-navy"
            }`}
          />
          <VoiceInputButton onTranscribed={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))} />
          <button
            onClick={send}
            disabled={!canSend}
            aria-label={taskMode ? "Assign task" : "Send"}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white transition active:scale-95 disabled:opacity-40 ${
              taskMode ? "bg-brand-gold hover:brightness-105" : "bg-brand-navy hover:bg-brand-navy-soft"
            }`}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : taskMode ? <ClipboardCheck size={18} /> : <SendHorizontal size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function AttachmentView({ url, name, type, mine }: { url: string; name: string; type: string; mine: boolean }) {
  if (isImage(type)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name || "Photo"} loading="lazy" className="max-h-80 w-full min-w-[12rem] object-cover" />
      </a>
    );
  }
  if (isVideo(type)) {
    return <video src={url} controls preload="metadata" className="max-h-80 w-full min-w-[12rem] bg-black" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2.5 px-3 py-2.5 ${mine ? "border-b border-white/10" : "border-b border-slate-100"}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${mine ? "bg-white/15" : "bg-red-50 text-red-600"}`}>
        <FileText size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name || "File"}</span>
        <span className={`block text-[11px] ${mine ? "text-slate-300" : "text-slate-400"}`}>Tap to open</span>
      </span>
      <ExternalLink size={14} className="shrink-0 opacity-60" />
    </a>
  );
}

function TaskCard({
  title,
  due,
  status,
  href,
  attachment,
  time,
}: {
  title: string;
  due?: string;
  status?: string;
  href?: string;
  attachment: Attachment | null;
  time: string;
}) {
  const inner = (
    <div className="overflow-hidden rounded-[14px] bg-white">
      {attachment && isImage(attachment.type) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={attachment.url} alt={attachment.name || "Reference"} loading="lazy" className="max-h-48 w-full object-cover" />
      )}
      <div className="px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-brand-gold">
          <span className="flex items-center gap-1.5">
            <ClipboardCheck size={12} /> Task assigned
          </span>
          {status && <span className="rounded-full bg-slate-100 px-2 py-0.5 normal-case tracking-normal text-slate-600">{STATUS_LABEL[status] ?? status}</span>}
        </div>
        <p className="mt-1 break-words text-sm font-semibold leading-snug text-slate-900">{title}</p>
        {attachment && !isImage(attachment.type) && (
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
            <FileText size={12} className="shrink-0" /> {attachment.name}
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-slate-500">
          {due ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={11} /> Due {prettyDate(due)}
            </span>
          ) : (
            <span />
          )}
          <span className="text-slate-400">{time}</span>
        </div>
        {href && <p className="mt-2 text-xs font-semibold text-brand-navy">Open task</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-[80%] rounded-2xl bg-gradient-to-br from-brand-gold to-amber-300 p-[2px] shadow-md sm:max-w-[65%]">
      {href ? (
        <Link href={href} className="block transition hover:opacity-95">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
