import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (nextUrl.pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(role === "site_staff" ? "/site" : "/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const isSiteStaffRoute = nextUrl.pathname === "/site" || nextUrl.pathname.startsWith("/site/");

  if (isSiteStaffRoute && role !== "site_staff") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (
    (nextUrl.pathname.startsWith("/dashboard") ||
      nextUrl.pathname.startsWith("/tasks") ||
      nextUrl.pathname.startsWith("/sites") ||
      nextUrl.pathname.startsWith("/staff") ||
      nextUrl.pathname.startsWith("/queries") ||
      nextUrl.pathname.startsWith("/insights")) &&
    role === "site_staff"
  ) {
    return NextResponse.redirect(new URL("/site", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|apple-touch-icon.png).*)",
  ],
};
