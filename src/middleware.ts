import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "jodarsh-admin-secret-key";
const secret = new TextEncoder().encode(SESSION_SECRET);

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("admin_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and Next.js internals
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Root → redirect based on auth
  if (pathname === "/") {
    const authed = await isAuthenticated(req);
    return NextResponse.redirect(
      new URL(authed ? "/dashboard" : "/login", req.url)
    );
  }

  // Protect all non-API protected routes
  if (!pathname.startsWith("/api/")) {
    const authed = await isAuthenticated(req);
    if (!authed) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
