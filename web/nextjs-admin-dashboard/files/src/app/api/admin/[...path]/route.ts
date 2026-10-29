import type { NextRequest } from "next/server";
import { API_URL } from "@/lib/auth-config";
import { forwardToApi } from "@/lib/forward";

// /api/admin/<path> on this app -> <API_URL>/admin/<path> on the backend, with the admin's token.
// More specific routes under src/app/api/admin (for example from `gpp admin generate-crud`) take precedence.
async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API_URL}/admin/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  return forwardToApi(request, target);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
