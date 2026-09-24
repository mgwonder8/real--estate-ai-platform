import { readTable, deleteRowById } from "@/lib/google/sheet-table";
import { createSite, listSites } from "@/lib/data/sites";
import { createStaff, listStaff } from "@/lib/data/staff";
import { createUser, findUserByEmail } from "@/lib/data/users";
import { createTask, listTasks, updateTaskStatus, approveTask } from "@/lib/data/tasks";
import { addProof } from "@/lib/data/proofs";
import { addTaskComment } from "@/lib/data/task-comments";
import { raiseQuery, replyToQuery, listAllQueries } from "@/lib/data/queries";
import type { Site, Staff, TaskPriority } from "@/lib/data/types";

async function findOrCreateSite(input: { name: string; address: string; briefText: string }): Promise<Site> {
  const existing = (await listSites()).find((s) => s.name === input.name);
  if (existing) {
    console.log(`  Site "${input.name}" already exists, skipping.`);
    return existing;
  }
  return createSite(input);
}

async function findOrCreateStaffWithLogin(input: {
  name: string;
  role: "site_staff" | "office_staff";
  email: string;
  phone?: string;
  siteId?: string;
  password: string;
}): Promise<Staff> {
  const existingStaff = (await listStaff()).find((s) => s.email === input.email);
  if (existingStaff) {
    console.log(`  Staff "${input.name}" already exists, skipping.`);
    return existingStaff;
  }
  const staff = await createStaff({
    name: input.name,
    role: input.role,
    email: input.email,
    phone: input.phone,
    siteId: input.siteId,
  });
  const existingUser = await findUserByEmail(input.email);
  if (!existingUser) {
    await createUser({ email: input.email, password: input.password, staffId: staff.id });
  }
  return staff;
}

async function removeTestData() {
  console.log("Removing earlier test data...");
  const { rows: siteRows } = await readTable("Sites");
  const testSite = siteRows.find((r) => r.data.name === "Sunrise Residency");
  const { rows: staffRows } = await readTable("Staff");
  const testStaff = staffRows.find((r) => r.data.email === "ramesh@example.com");
  const { rows: taskRows } = await readTable("Tasks");
  const testTask = taskRows.find((r) => r.data.title === "Fix leaking pipe in unit 4B");
  const { rows: userRows } = await readTable("Users");
  const testUser = userRows.find((r) => r.data.email === "ramesh@example.com");

  if (testTask) {
    const { rows: proofRows } = await readTable("Proofs");
    for (const p of proofRows.filter((r) => r.data.task_id === testTask.data.id)) {
      await deleteRowById("Proofs", p.data.id);
    }
    const { rows: updateRows } = await readTable("TaskUpdates");
    for (const u of updateRows.filter((r) => r.data.task_id === testTask.data.id)) {
      await deleteRowById("TaskUpdates", u.data.id);
    }
    await deleteRowById("Tasks", testTask.data.id);
    console.log("  Removed test task + its proofs/updates");
  }
  if (testStaff) {
    await deleteRowById("Staff", testStaff.data.id);
    console.log("  Removed test staff");
  }
  if (testUser) {
    await deleteRowById("Users", testUser.data.id);
    console.log("  Removed test user login");
  }
  if (testSite) {
    await deleteRowById("Sites", testSite.data.id);
    console.log("  Removed test site");
  }
}

async function main() {
  await removeTestData();

  console.log("Creating real Manjeet Pride Group sites...");

  const oneWorld = await findOrCreateSite({
    name: "One World",
    address: "Opp. Airport, Hyatt Road, Chh. Sambhajinagar, Maharashtra",
    briefText:
      "11-acre development with 21-story towers (tallest in the city). 2/3/4 BHK plus 5-7 BHK Sky Villas, retail and offices. " +
      "100+ amenities including pool, gym, dance hall, basketball & tennis courts, yoga terrace, clubhouse, EV charging points, " +
      "and a half-acre indigenous eco-jungle with treehouses. RERA-registered, ongoing construction.",
  });

  const dreamWorld = await findOrCreateSite({
    name: "Dream World",
    address: "CIDCO N1 Area, Chh. Sambhajinagar, Maharashtra",
    briefText:
      "5.5-acre landscaped development, 2/3/4 BHK residences plus 5-7 BHK celebrity penthouses. IGBC Green certified. " +
      "Infinity-edge pool, fitness center, clubhouse, library/book café, co-working space, amphitheatre, organic farming area. " +
      "Featured in Architectural Digest. Ongoing construction.",
  });

  const landmark = await findOrCreateSite({
    name: "Manjeet Pride Landmark",
    address: "Dhule, Maharashtra",
    briefText:
      "Gated community on 9m & 12m wide roads with CCTV monitoring, 10,000 planted trees, underground water storage, " +
      "rainwater harvesting and drip irrigation. 2/3/4 BHK residences, 5-7 BHK penthouses, and commercial plots on DP roads. " +
      "Amenities include multi-sports facilities, clubhouse, LED dancing fountain, open-air gym, and Oxygen Garden. Land approvals secured, ongoing construction.",
  });

  const myWorldVxl = await findOrCreateSite({
    name: "My World & VXL Residences",
    address: "Opp. Chh. Sambhajinagar Airport, Jalna Road, Maharashtra",
    briefText:
      "Completed development, 900+ units fully sold and handed over to the association; 750+ families in residence. " +
      "IGBC Gold certified with rainwater harvesting, energy-efficient systems, and a 630 KLD Sewage Treatment Plant. " +
      "Now in post-handover maintenance mode.",
  });

  console.log("Creating site staff...");

  function makeSiteStaff(name: string, email: string, phone: string, siteId: string) {
    return findOrCreateStaffWithLogin({ name, role: "site_staff", email, phone, siteId, password: "pride123" });
  }

  const oneWorldStaff1 = await makeSiteStaff("Suresh Pawar", "suresh.pawar@manjeetpridegroup.com", "9822011001", oneWorld.id);
  await makeSiteStaff("Vikas Deshmukh", "vikas.deshmukh@manjeetpridegroup.com", "9822011002", oneWorld.id);

  const dreamWorldStaff1 = await makeSiteStaff("Sanjay Jadhav", "sanjay.jadhav@manjeetpridegroup.com", "9822011003", dreamWorld.id);
  await makeSiteStaff("Amol Kulkarni", "amol.kulkarni@manjeetpridegroup.com", "9822011004", dreamWorld.id);

  const landmarkStaff1 = await makeSiteStaff("Ravindra Shinde", "ravindra.shinde@manjeetpridegroup.com", "9822011005", landmark.id);
  await makeSiteStaff("Nitin Bhosale", "nitin.bhosale@manjeetpridegroup.com", "9822011006", landmark.id);

  const vxlStaff1 = await makeSiteStaff("Prakash More", "prakash.more@manjeetpridegroup.com", "9822011007", myWorldVxl.id);
  await makeSiteStaff("Ganesh Wagh", "ganesh.wagh@manjeetpridegroup.com", "9822011008", myWorldVxl.id);

  console.log("Creating office staff...");
  const office1 = await findOrCreateStaffWithLogin({
    name: "Priya Kale",
    role: "office_staff",
    email: "priya.kale@manjeetpridegroup.com",
    phone: "9822012001",
    password: "pride123",
  });

  console.log("Creating sample tasks...");

  const existingTasks = await listTasks();

  async function makeTask(input: {
    title: string;
    brief: string;
    siteId: string;
    assigneeIds: string[];
    priority: TaskPriority;
    deadline: string;
    resourceLink?: string;
  }) {
    const existing = existingTasks.find((t) => t.title === input.title && t.siteId === input.siteId);
    if (existing) {
      console.log(`  Task "${input.title}" already exists, skipping.`);
      return existing;
    }
    return createTask({
      ...input,
      createdBy: office1.id,
      proofRequired: true,
    });
  }

  // One World tasks
  const t1 = await makeTask({
    title: "Verify EV charging point installation — Tower B",
    brief: "Confirm all EV charging points on Tower B parking level are wired and tested per the electrical plan.",
    siteId: oneWorld.id,
    assigneeIds: [oneWorldStaff1.id],
    priority: "normal",
    deadline: futureDate(5),
  });
  const t2 = await makeTask({
    title: "Inspect eco-jungle treehouse structural safety",
    brief: "Full structural safety check on the treehouse structures in the indigenous eco-jungle before it opens to residents.",
    siteId: oneWorld.id,
    assigneeIds: [oneWorldStaff1.id],
    priority: "urgent",
    deadline: futureDate(2),
    resourceLink: "https://manjeetpridegroup.com/one_world",
  });

  // Dream World tasks
  const t3 = await makeTask({
    title: "Check infinity-edge pool tiling and seal",
    brief: "Inspect tiling and edge sealing on the infinity-edge pool ahead of water testing.",
    siteId: dreamWorld.id,
    assigneeIds: [dreamWorldStaff1.id],
    priority: "urgent",
    deadline: pastDate(1),
  });
  const t4 = await makeTask({
    title: "Confirm co-working space furniture delivery",
    brief: "Verify furniture delivery and setup for the residents' co-working space matches the vendor order.",
    siteId: dreamWorld.id,
    assigneeIds: [dreamWorldStaff1.id],
    priority: "normal",
    deadline: futureDate(7),
  });

  // Manjeet Pride Landmark tasks
  const t5 = await makeTask({
    title: "Test LED dancing fountain electrical & water sync",
    brief: "Run a full test cycle on the LED dancing fountain — check electrical timing sync against the water jets.",
    siteId: landmark.id,
    assigneeIds: [landmarkStaff1.id],
    priority: "normal",
    deadline: futureDate(10),
  });
  const t6 = await makeTask({
    title: "CCTV camera installation audit — main gate",
    brief: "Audit CCTV camera coverage and recording status at the main gated-community entrance.",
    siteId: landmark.id,
    assigneeIds: [landmarkStaff1.id],
    priority: "urgent",
    deadline: futureDate(3),
    resourceLink: "https://manjeetpridegroup.com/manjeet_pride_landmark",
  });

  // My World & VXL (maintenance)
  const t7 = await makeTask({
    title: "Annual STP maintenance check",
    brief: "Scheduled annual maintenance and inspection of the 630 KLD Sewage Treatment Plant.",
    siteId: myWorldVxl.id,
    assigneeIds: [vxlStaff1.id],
    priority: "urgent",
    deadline: futureDate(4),
  });

  console.log("Advancing some tasks through the workflow to populate the demo...");

  // t3: pool tiling — move to in_progress then completed with proof, then approved
  if (t3.status === "pending") {
    await updateTaskStatus({ taskId: t3.id, toStatus: "in_progress", changedBy: dreamWorldStaff1.id });
    await addProof({
      taskId: t3.id,
      submittedBy: dreamWorldStaff1.id,
      notes: "Tiling redone along the north edge, sealant reapplied. Ready for water test tomorrow.",
    });
    await updateTaskStatus({ taskId: t3.id, toStatus: "completed", changedBy: dreamWorldStaff1.id });
    await approveTask({
      taskId: t3.id,
      approvedBy: office1.id,
      approverRole: "office_staff",
      comment: "Good work — water test scheduled for Thursday.",
    });
  } else {
    console.log(`  Task "${t3.title}" already advanced (status=${t3.status}), skipping.`);
  }

  // t1: EV charging — move to in_progress
  if (t1.status === "pending") {
    await updateTaskStatus({ taskId: t1.id, toStatus: "in_progress", changedBy: oneWorldStaff1.id });
  } else {
    console.log(`  Task "${t1.title}" already advanced (status=${t1.status}), skipping.`);
  }

  // t6: CCTV audit — completed, awaiting approval
  if (t6.status === "pending") {
    await updateTaskStatus({ taskId: t6.id, toStatus: "in_progress", changedBy: landmarkStaff1.id });
    await addProof({
      taskId: t6.id,
      submittedBy: landmarkStaff1.id,
      notes: "All 6 main-gate cameras confirmed recording. One angle needs adjustment — flagged to security vendor.",
    });
    await updateTaskStatus({ taskId: t6.id, toStatus: "completed", changedBy: landmarkStaff1.id });
    await addTaskComment({
      taskId: t6.id,
      authorId: office1.id,
      authorRole: "office_staff",
      message: "Thanks Ravindra — please share the vendor's ticket number for the angle adjustment once raised.",
    });
  } else {
    console.log(`  Task "${t6.title}" already advanced (status=${t6.status}), skipping.`);
  }

  console.log("Adding a sample query...");
  const alreadyRaised = (await listAllQueries()).some((q) => q.taskId === t2.id);
  if (!alreadyRaised) {
    const q1 = await raiseQuery({
      raisedBy: oneWorldStaff1.id,
      siteId: oneWorld.id,
      taskId: t2.id,
      message: "The treehouse access ladder on the north side looks unstable — should we halt access until it's re-fixed?",
    });
    await replyToQuery({
      queryId: q1.id,
      reply: "Yes, cordon it off immediately and get the contractor to inspect before anyone uses it again.",
      repliedBy: office1.id,
    });
  } else {
    console.log("  Sample query already exists, skipping.");
  }

  console.log("\nDone. Sample data summary:");
  console.log("  Sites: One World, Dream World, Manjeet Pride Landmark, My World & VXL Residences");
  console.log("  Site staff logins (password: pride123):");
  console.log("    suresh.pawar@manjeetpridegroup.com, vikas.deshmukh@manjeetpridegroup.com (One World)");
  console.log("    sanjay.jadhav@manjeetpridegroup.com, amol.kulkarni@manjeetpridegroup.com (Dream World)");
  console.log("    ravindra.shinde@manjeetpridegroup.com, nitin.bhosale@manjeetpridegroup.com (Manjeet Pride Landmark)");
  console.log("    prakash.more@manjeetpridegroup.com, ganesh.wagh@manjeetpridegroup.com (My World & VXL)");
  console.log("  Office staff login: priya.kale@manjeetpridegroup.com / pride123");
  console.log(`  Tasks created: ${[t1, t2, t3, t4, t5, t6, t7].length}`);
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
