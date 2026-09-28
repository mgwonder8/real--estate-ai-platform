import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseTaskFromChat, isAiEnabled } from "@/lib/ai/openai";
import { listSites } from "@/lib/data/sites";
import { listStaff, getStaff } from "@/lib/data/staff";
import { createTask } from "@/lib/data/tasks";
import { sendMessage } from "@/lib/data/messages";
import { notifyManyStaff } from "@/lib/push/send";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toStaffId, instruction } = await req.json();
  if (!toStaffId || !instruction?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI is not configured on the server" }, { status: 400 });
  }

  const [sites, staff, partner, sender] = await Promise.all([
    listSites(),
    listStaff(),
    getStaff(toStaffId),
    getStaff(session.user.id),
  ]);

  if (!partner) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

  const draft = await parseTaskFromChat({
    message: instruction.trim(),
    sites: sites.map((s) => ({ id: s.id, name: s.name })),
    staff: staff
      .filter((s) => s.active)
      .map((s) => ({ id: s.id, name: s.name, role: s.role, siteId: s.siteId })),
  });

  // Force assignee to be the chat partner
  const assigneeIds = [partner.id];

  // Pick a site: prefer AI's suggestion if it matches the partner's sites; else partner's primary site
  const partnerSiteIds = [partner.siteId, ...partner.extraSiteIds].filter(Boolean);
  let siteId = "";
  if (draft.siteId && partnerSiteIds.includes(draft.siteId)) {
    siteId = draft.siteId;
  } else if (partnerSiteIds.length > 0) {
    siteId = partnerSiteIds[0];
  } else if (sites.length > 0) {
    siteId = sites[0].id;
  }

  const task = await createTask({
    title: draft.title,
    brief: draft.brief,
    siteId,
    assigneeIds,
    createdBy: session.user.id,
    priority: draft.priority,
    deadline: draft.deadline ?? "",
    proofRequired: draft.proofRequired,
    resourceLink: "",
    resourceFileUrl: "",
    resourceFileName: "",
  });

  // Post a confirmation into the chat so both sides see it in-thread
  const confirmationText = `✅ Task assigned: "${task.title}"${task.deadline ? ` — due ${task.deadline}` : ""}`;
  const confirmationMsg = await sendMessage(session.user.id, toStaffId, confirmationText);

  await notifyManyStaff([toStaffId], {
    title: `New task from ${sender?.name ?? "someone"}`,
    body: task.title,
    url: `/tasks/${task.id}`,
  });

  revalidatePath("/tasks", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/site");

  return NextResponse.json({
    message: confirmationMsg,
    task: { id: task.id, title: task.title, deadline: task.deadline },
  });
}
