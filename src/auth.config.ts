import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      siteId: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    staffId?: string;
    role?: string;
    siteId?: string;
    name?: string;
  }
}

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.staffId = (user as { staffId: string }).staffId;
        token.role = (user as { role: string }).role;
        token.siteId = (user as { siteId: string }).siteId;
        token.name = user.name ?? "";
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.staffId ?? "";
      session.user.role = token.role ?? "";
      session.user.siteId = token.siteId ?? "";
      session.user.name = token.name ?? "";
      return session;
    },
  },
};
