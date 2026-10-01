import { appendRow, ensureTable, findRowById, readTable, updateRow, clearRow } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import type { PersonalTask, TaskPriority } from "@/lib/data/types";

// Private tasks between two people. Kept in their own tab, so nothing that lists site tasks
// (owner views, site boards, insights) can ever pick them up.
const TAB = "PersonalTasks";
const HEADERS = ["id", "from_id", "to_id", "for_id", "title", "remark", "priority", "done", "done_at", "created_at"];
const PRIORITIES: TaskPriority[] = ["low", "normal", "high", "urgent"];

function toPersonalTask(data: Record<string, string>): PersonalTask {
  return {
    id: data.id,
    fromId: data.from_id,
    toId: data.to_id,
    forId: data.for_id || data.to_id,
    title: data.title ?? "",
    remark: data.remark ?? "",
    priority: PRIORITIES.includes(data.priority as TaskPriority) ? (data.priority as TaskPriority) : "normal",
    done: data.done === "TRUE" || data.done === "true",
    doneAt: data.done_at ?? "",
    createdAt: data.created_at,
  };
}

const between = (t: PersonalTask, a: string, b: string) =>
  (t.fromId === a && t.toId === b) || (t.fromId === b && t.toId === a);

async function readAll(): Promise<PersonalTask[]> {
  try {
    await ensureTable(TAB, HEADERS);
    const { rows } = await readTable(TAB);
    return rows.map((r) => toPersonalTask(r.data));
  } catch {
    return [];
  }
}

/** Every personal task involving this person, oldest first. */
export async function listPersonalTasksFor(staffId: string): Promise<PersonalTask[]> {
  const all = await readAll();
  return all.filter((t) => t.fromId === staffId || t.toId === staffId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listPersonalTasksBetween(a: string, b: string): Promise<PersonalTask[]> {
  const all = await readAll();
  return all.filter((t) => between(t, a, b)).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
}

export async function createPersonalTask(input: {
  fromId: string;
  toId: string;
  forId: string;
  title: string;
  remark: string;
  priority: TaskPriority;
}): Promise<PersonalTask> {
  await ensureTable(TAB, HEADERS);
  const task: PersonalTask = { id: newId("ptask"), ...input, done: false, doneAt: "", createdAt: new Date().toISOString() };
  await appendRow(TAB, {
    id: task.id,
    from_id: task.fromId,
    to_id: task.toId,
    for_id: task.forId,
    title: task.title,
    remark: task.remark,
    priority: task.priority,
    done: "FALSE",
    done_at: "",
    created_at: task.createdAt,
  });
  return task;
}

async function findOwned(id: string, staffId: string) {
  const row = await findRowById(TAB, id);
  if (!row) throw new Error("Task not found");
  const task = toPersonalTask(row.data);
  if (task.fromId !== staffId && task.toId !== staffId) throw new Error("Task not found");
  return { row, task };
}

/** Either person in the pair can tick or untick. */
export async function togglePersonalTask(id: string, staffId: string): Promise<PersonalTask> {
  const { row, task } = await findOwned(id, staffId);
  const done = !task.done;
  const doneAt = done ? new Date().toISOString() : "";
  await updateRow(TAB, row.rowNumber, { ...row.data, done: done ? "TRUE" : "FALSE", done_at: doneAt });
  return { ...task, done, doneAt };
}

/** Only whoever created it can delete it. */
export async function deletePersonalTask(id: string, staffId: string): Promise<void> {
  const { row, task } = await findOwned(id, staffId);
  if (task.fromId !== staffId) throw new Error("Only the person who added this task can delete it");
  await clearRow(TAB, row.rowNumber);
}
