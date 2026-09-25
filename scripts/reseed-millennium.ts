import "dotenv/config";
import { readTable, clearRow } from "@/lib/google/sheet-table";
import { createSite } from "@/lib/data/sites";
import { createStaff } from "@/lib/data/staff";
import { createUser } from "@/lib/data/users";
import { createTask, updateTaskStatus, approveTask } from "@/lib/data/tasks";
import { addProof } from "@/lib/data/proofs";
import { addTaskComment } from "@/lib/data/task-comments";
import { raiseQuery, replyToQuery } from "@/lib/data/queries";
import type { TaskPriority } from "@/lib/data/types";

const TABS_TO_WIPE = [
  "Tasks",
  "TaskUpdates",
  "TaskComments",
  "Proofs",
  "Queries",
  "Staff",
  "Users",
  "Sites",
  "PushSubscriptions",
];

async function wipeAll() {
  for (const tab of TABS_TO_WIPE) {
    // Loop until the table is empty — retry after any rate-limit hiccups mid-wipe.
    for (let pass = 0; pass < 5; pass++) {
      try {
        const { rows } = await readTable(tab);
        if (rows.length === 0) {
          if (pass === 0) console.log(`  [${tab}] already empty`);
          break;
        }
        console.log(`  [${tab}] pass ${pass + 1} — clearing ${rows.length} row(s)…`);
        for (const r of rows) {
          await clearRow(tab, r.rowNumber);
          await new Promise((r) => setTimeout(r, 120));
        }
      } catch (err) {
        console.warn(`  [${tab}] pass ${pass + 1} skipped (${(err as Error).message})`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function pastDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Wiping existing data…");
  await wipeAll();

  console.log("\nCreating Millennium Group sites…");
  const govindham = await createSite({
    name: "Govindham",
    address: "Jalna, Maharashtra",
    briefText:
      "Premium residential development on the Jalna–Aurangabad corridor. 2/3 BHK residences with clubhouse, landscaped gardens, kids' play area and 24×7 security. Ongoing construction across two towers.",
  });

  const ranaUtrayan = await createSite({
    name: "Rana Utrayan",
    address: "Jalna, Maharashtra",
    briefText:
      "Mid-rise gated community with 2/3 BHK apartments, retail on the ground level and dedicated parking. Landscaped courtyards and IGBC-aligned water systems. Phase-1 handover in progress.",
  });

  const millenniumHeights = await createSite({
    name: "Millennium Heights",
    address: "Aurangabad Road, Jalna, Maharashtra",
    briefText:
      "Flagship high-rise project — 3/4 BHK residences with clubhouse, pool and rooftop garden. Structural work in progress; MEP scheduled next quarter.",
  });

  console.log("Creating owner accounts…");
  const rahul = await createStaff({
    name: "Rahul",
    role: "owner",
    email: "Rahul@owner.com",
    phone: "9800000001",
  });
  await createUser({ email: "Rahul@owner.com", password: "milleniumgroup", staffId: rahul.id });

  const kedar = await createStaff({
    name: "Kedar",
    role: "owner",
    email: "Kedar@owner.com",
    phone: "9800000002",
  });
  await createUser({ email: "Kedar@owner.com", password: "milleniumgroup", staffId: kedar.id });

  console.log("Creating site staff accounts…");
  const vinayak = await createStaff({
    name: "Vinayak",
    role: "site_staff",
    email: "Vinayak@staff.com",
    phone: "9811000001",
    siteId: govindham.id,
  });
  await createUser({ email: "Vinayak@staff.com", password: "milleniumgroup", staffId: vinayak.id });

  const ganesh = await createStaff({
    name: "Ganesh",
    role: "site_staff",
    email: "ganesh@staff.com",
    phone: "9811000002",
    siteId: ranaUtrayan.id,
  });
  await createUser({ email: "ganesh@staff.com", password: "milleniumgroup", staffId: ganesh.id });

  console.log("Creating sample tasks…");

  async function mk(input: {
    title: string;
    brief: string;
    siteId: string;
    assigneeIds: string[];
    priority: TaskPriority;
    deadline: string;
  }) {
    return createTask({
      ...input,
      createdBy: rahul.id,
      proofRequired: true,
    });
  }

  // Govindham (Vinayak)
  const gTask1 = await mk({
    title: "Check tower B plaster finish — 4th floor",
    brief: "Verify wall plaster quality on all 4th floor units. Flag any uneven patches to the contractor.",
    siteId: govindham.id,
    assigneeIds: [vinayak.id],
    priority: "normal",
    deadline: futureDate(3),
  });

  const gTask2 = await mk({
    title: "Landscape material delivery inspection",
    brief: "Inspect the paver blocks and soil delivery for the clubhouse garden. Match against the vendor invoice.",
    siteId: govindham.id,
    assigneeIds: [vinayak.id],
    priority: "urgent",
    deadline: pastDate(1),
  });

  const gTask3 = await mk({
    title: "Electrical rough-in audit — Tower A basement",
    brief: "Walk through Tower A basement with the electrical contractor and confirm conduit routing matches the plan.",
    siteId: govindham.id,
    assigneeIds: [vinayak.id],
    priority: "normal",
    deadline: futureDate(7),
  });

  // Rana Utrayan (Ganesh)
  const rTask1 = await mk({
    title: "Parking-lot signage verification",
    brief: "Confirm reserved-parking numbering and directional signage matches the handover plan.",
    siteId: ranaUtrayan.id,
    assigneeIds: [ganesh.id],
    priority: "normal",
    deadline: futureDate(4),
  });

  const rTask2 = await mk({
    title: "Test water pressure — Building 2",
    brief: "Run pressure test on all risers in Building 2 and log readings. Report any drops below 2.5 bar.",
    siteId: ranaUtrayan.id,
    assigneeIds: [ganesh.id],
    priority: "urgent",
    deadline: futureDate(1),
  });

  // Millennium Heights (Both staff, joint task)
  await mk({
    title: "Joint safety walkthrough — 12th floor slab",
    brief: "Both site staff to walk the newly cast 12th-floor slab with the structural consultant.",
    siteId: millenniumHeights.id,
    assigneeIds: [vinayak.id, ganesh.id],
    priority: "urgent",
    deadline: futureDate(2),
  });

  console.log("Advancing sample tasks through the workflow…");

  // gTask2 — overdue landscape delivery, now completed with proof awaiting approval
  await updateTaskStatus({ taskId: gTask2.id, toStatus: "in_progress", changedBy: vinayak.id });
  await addProof({
    taskId: gTask2.id,
    submittedBy: vinayak.id,
    notes: "Paver blocks delivered. Count matches invoice. Soil quality looks good; stored in dry corner.",
  });
  await updateTaskStatus({ taskId: gTask2.id, toStatus: "completed", changedBy: vinayak.id });

  // gTask1 — in progress
  await updateTaskStatus({ taskId: gTask1.id, toStatus: "in_progress", changedBy: vinayak.id });

  // rTask2 — completed and approved
  await updateTaskStatus({ taskId: rTask2.id, toStatus: "in_progress", changedBy: ganesh.id });
  await addProof({
    taskId: rTask2.id,
    submittedBy: ganesh.id,
    notes: "Pressure test completed. All risers between 2.8–3.1 bar. Readings logged in vendor sheet.",
  });
  await updateTaskStatus({ taskId: rTask2.id, toStatus: "completed", changedBy: ganesh.id });
  await approveTask({
    taskId: rTask2.id,
    approvedBy: rahul.id,
    approverRole: "owner",
    comment: "Great — please share the vendor sheet link in the next site update.",
  });

  // rTask1 — comment thread example
  await addTaskComment({
    taskId: rTask1.id,
    authorId: kedar.id,
    authorRole: "owner",
    message: "Please double-check that visitor slots on level P1 are marked separately.",
  });

  console.log("Adding a sample query…");
  const q = await raiseQuery({
    raisedBy: vinayak.id,
    siteId: govindham.id,
    taskId: gTask3.id,
    message: "Electrical contractor didn't turn up today. Should I reschedule the audit or escalate?",
  });
  await replyToQuery({
    queryId: q.id,
    reply: "Escalate to the vendor lead and reschedule for tomorrow morning. Copy Kedar on the mail.",
    repliedBy: rahul.id,
  });

  console.log("\nDone.");
  console.log("Logins (password: milleniumgroup):");
  console.log("  Owners: Rahul@owner.com, Kedar@owner.com");
  console.log("  Site staff: Vinayak@staff.com, ganesh@staff.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
