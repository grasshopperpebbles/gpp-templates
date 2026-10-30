import type { NextRequest } from "next/server";
import { API_URL } from "@/lib/auth-config";
import { forwardToApi } from "@/lib/forward";

// /api/backend/<path> on this app -> <API_URL>/<path> on the backend, with the signed-in user's token.
// Requests from signed-out visitors (for example /auth/register) are forwarded without one.
async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forwardToApi(request, { base: API_URL, path, allowAnonymous: true });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
