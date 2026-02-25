import { type NextRequest } from "next/server";
import { firebaseMiddleware } from "@/lib/firebase/middleware";

export function middleware(request: NextRequest) {
  return firebaseMiddleware(request, {
    // Customize protected routes as needed
    // protectedRoutes: ["/dashboard", "/account", "/settings"],
    // authRoutes: ["/login", "/register"],
    // loginPath: "/login",
    // dashboardPath: "/dashboard",
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
