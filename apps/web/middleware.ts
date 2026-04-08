import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Landing: redirect authenticated users to dashboard
    if (path === "/") {
      if (!token) return NextResponse.next();
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // All matched routes require auth
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === "/") return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/movimientos/:path*",
    "/estados-cuenta/:path*",
    "/recurrentes/:path*",
    "/alertas/:path*",
    "/configuracion/:path*",
    "/onboarding/:path*",
  ],
};
