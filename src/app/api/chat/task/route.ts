import { NextRequest, NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { parseTaskFromChat, isAiEnabled } from "@/lib/ai/openai";
import { listSites } from "@/lib/data/sites";
import { listStaff, getStaff } from "@/lib/data/staff";
import { createTask } from "@/lib/data/tasks";
import { sendMessage } from "@/lib/data/messages";
import { notifyManyStaff } from "@/lib/push/send";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "site_staff") {
    return NextResponse.json({ error: "Only the office can assign tasks" }, { status: 403 });
  }

  const { toStaffId, instruction, attachment } = await req.json();
  if (!toStaffId || !String(instruction ?? "").trim()) {
    return NextResponse.json({ error: "Describe the task after /task" }, { status: 400 });
  }
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI is not configured on the server" }, { status: 400 });
  }

  const [sites, staff, partner] = await Promise.all([listSites(), listStaff(), getStaff(toStaffId)]);
  if (!partner) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

  const draft = await parseTaskFromChat({
    message: String(instruction).trim(),
    sites: sites.map((s) => ({ id: s.id, name: s.name })),
    staff: staff.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name, role: s.role, siteId: s.siteId })),
  });

  const partnerSiteIds = [partner.siteId, ...partner.extraSiteIds].filter(Boolean);
  const siteId =
    draft.siteId && partnerSiteIds.includes(draft.siteId)
      ? draft.siteId
      : partnerSiteIds[0] ?? draft.siteId ?? sites[0]?.id ?? "";

  const task = await createTask({
    title: draft.title,
    brief: draft.brief,
    siteId,
    assigneeIds: [partner.id],
    createdBy: session.user.id,
    priority: draft.priority,
    deadline: draft.deadline ?? "",
    proofRequired: draft.proofRequired,
    resourceLink: "",
    resourceFileUrl: attachment?.url ?? "",
    resourceFileName: attachment?.name ?? "",
  });

  const text = `Task assigned: "${task.title}"${task.deadline ? `, due ${task.deadline}` : ""}`;
  const confirmation = await sendMessage(session.user.id, toStaffId, text, attachment ?? undefined, task.id);

  revalidatePath("/tasks", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/site");

  const senderId = session.user.id;
  after(async () => {
    const sender = await getStaff(senderId);
    await notifyManyStaff([toStaffId], {
      title: `New task from ${sender?.name ?? "the office"}`,
      body: task.title,
      url: "/site",
    });
  });

  return NextResponse.json({
    message: confirmation,
    task: { id: task.id, title: task.title, deadline: task.deadline, status: task.status },
  });
}
