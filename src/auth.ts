import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { findUserByEmail, verifyPassword } from "@/lib/data/users";
import { getStaff } from "@/lib/data/staff";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user) return null;

        const valid = await verifyPassword(user, password);
        if (!valid) return null;

        const staff = await getStaff(user.staffId);
        if (!staff || !staff.active) return null;

        return {
          id: user.id,
          email: user.email,
          name: staff.name,
          role: staff.role,
          siteId: staff.siteId,
          staffId: staff.id,
        };
      },
    }),
  ],
});
