import type { NextRequest } from "next/server";
import { API_URL } from "@/lib/auth-config";
import { forwardToApi } from "@/lib/forward";

// /api/admin/<path> on this app -> <API_URL>/admin/<path> on the backend, with the admin's token.
// More specific routes under src/app/api/admin take precedence.
async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forwardToApi(request, { base: `${API_URL}/admin`, path, requireAdmin: true });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
