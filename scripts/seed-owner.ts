import "dotenv/config";
import { createStaff } from "@/lib/data/staff";
import { createUser, findUserByEmail } from "@/lib/data/users";

const EMAIL = "pridegroup@gmail.com";
const PASSWORD = "pride";

async function main() {
  const existing = await findUserByEmail(EMAIL);
  if (existing) {
    console.log(`User ${EMAIL} already exists (id: ${existing.id}). Skipping.`);
    return;
  }

  const staff = await createStaff({
    name: "Pride Group Owner",
    role: "owner",
    email: EMAIL,
  });

  await createUser({ email: EMAIL, password: PASSWORD, staffId: staff.id });

  console.log("Seeded test login:");
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
