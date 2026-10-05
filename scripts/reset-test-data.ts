import { getSheetsClient } from "@/lib/google/clients";
import { env } from "@/lib/env";

// Clears everything people created while testing. Staff, logins and sites are kept,
// so everyone can sign in and start again with task #1.
const CLEAR = ["Tasks", "TaskUpdates", "TaskComments", "TaskReferences", "Proofs", "Messages", "PersonalTasks", "Queries"];
const KEEP = ["Staff", "Users", "Sites", "PushSubscriptions"];

async function main() {
  if (!process.argv.includes("--yes")) {
    console.log("This clears all tasks, task history, proof, files, comments, chats, private tasks and queries.");
    console.log(`It keeps: ${KEEP.join(", ")}.`);
    console.log("\nRun again with --yes to go ahead:  npm run reset:test -- --yes");
    return;
  }

  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: env.spreadsheetId, fields: "sheets.properties.title" });
  const existing = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title ?? ""));

  for (const tab of CLEAR) {
    if (!existing.has(tab)) {
      console.log(`  ${tab}: not created yet, nothing to clear`);
      continue;
    }
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: env.spreadsheetId, range: `${tab}!A2:A` });
    const rows = (res.data.values ?? []).filter((r) => r.some((v) => String(v).trim())).length;
    // Row 1 holds the column names and stays.
    await sheets.spreadsheets.values.clear({ spreadsheetId: env.spreadsheetId, range: `${tab}!A2:ZZ` });
    console.log(`  ${tab}: cleared ${rows} row(s)`);
  }

  console.log(`\nDone. Kept: ${KEEP.join(", ")}. New tasks start again at #1.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
