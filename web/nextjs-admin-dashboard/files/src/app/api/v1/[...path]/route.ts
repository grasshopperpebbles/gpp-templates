import type { NextRequest } from "next/server";
import { API_URL } from "@/lib/auth-config";
import { forwardToApi } from "@/lib/forward";

// /api/v1/<path> on this app -> <API_URL>/<path> on the backend.
// API_URL already ends with /api/v1, so /api/v1/users becomes <origin>/api/v1/users.
async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forwardToApi(request, { base: API_URL, path, requireAdmin: true });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
