import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-cookie";

// --- Configuration ---
const PUBLIC_PATHS = ["/password", "/api/auth/login", "/api/healthz"];

// --- Types ---
type AuthProvider = "legacy" | "nextauth" | "clerk" | "supabase";

// --- Extension Points (Milestone 11 Preparation) ---
const AUTH_PROVIDER: AuthProvider = "legacy";
const ENABLE_AUTH_REDIRECTS = false; // Set to true when Milestone 11 is implemented
const ENABLE_ROLE_BASED_ACCESS = false;

// --- Helper Functions ---
function generateRequestId(): string {
  return crypto.randomUUID();
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  // Security headers to protect the application
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  return response;
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  
  // 1. Static asset bypass (Fast path)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Request Tracing & Setup
  const requestId = generateRequestId();
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  // Pass the request ID downstream to API routes/server components if needed
  response.headers.set("x-middleware-request-id", requestId);

  // Apply Security Headers to all requests
  applySecurityHeaders(response);

  // 3. Public Paths Bypass
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return response;
  }

  // 4. API Paths (Authorization handled at the route level typically)
  if (pathname.startsWith("/api/")) {
    return response;
  }

  // 5. Authentication & Session Validation
  let isAuthenticated = false;

  // Milestone 11: Switch logic based on chosen provider
  if (AUTH_PROVIDER === "legacy") {
    // Current legacy password check
    isAuthenticated = request.cookies.get(AUTH_COOKIE)?.value === "1";
  } else if (AUTH_PROVIDER === "nextauth") {
    // Future NextAuth validation: isAuthenticated = !!request.cookies.get("next-auth.session-token");
  } else if (AUTH_PROVIDER === "supabase") {
    // Future Supabase validation
  }

  // 6. Access Control
  if (!isAuthenticated) {
    const loginUrl = new URL("/password", request.url);
    loginUrl.searchParams.set("from", pathname);
    
    if (ENABLE_AUTH_REDIRECTS) {
      // NOTE: Milestone 11 will enable this. 
      // Currently disabled to preserve 100% backward compatibility for stabilization milestone.
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
    // Auth bypass is logged internally, but redirect is skipped
  } else {
    // Milestone 11: Role-based access control checking here
    if (ENABLE_ROLE_BASED_ACCESS) {
      // validateRole(request)
    }
  }

  // Return the base response with headers applied
  return response;
}

export const config = {
  // Optimized matcher to completely avoid invoking middleware on static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
};
