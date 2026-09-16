import bcrypt from "bcryptjs";
import { appendRow, readTable } from "@/lib/google/sheet-table";
import { newId } from "@/lib/ids";
import type { User } from "@/lib/data/types";

const TAB = "Users";

function toUser(data: Record<string, string>): User {
  return {
    id: data.id,
    email: data.email,
    passwordHash: data.password_hash,
    staffId: data.staff_id,
    createdAt: data.created_at,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await readTable(TAB);
  const row = rows.find((r) => r.data.email.toLowerCase() === email.toLowerCase());
  return row ? toUser(row.data) : null;
}

export async function createUser(input: { email: string; password: string; staffId: string }): Promise<User> {
  const user: User = {
    id: newId("user"),
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 10),
    staffId: input.staffId,
    createdAt: new Date().toISOString(),
  };
  await appendRow(TAB, {
    id: user.id,
    email: user.email,
    password_hash: user.passwordHash,
    staff_id: user.staffId,
    created_at: user.createdAt,
  });
  return user;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}
