import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Server-only: forwards a browser request to the backend with the signed-in
 * user's API token, read from the encrypted session cookie. The browser never
 * sees the token, and the backend never sees the browser's cookies.
 */

const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "idempotency-key", "x-request-id"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "cache-control", "content-disposition", "etag", "last-modified"];

interface ForwardOptions {
  /** Backend URL that `path` is appended to. */
  base: string;
  /** Path segments from the route's catch-all parameter. */
  path?: string[];
  /** Refuse unless the signed-in user is an admin. */
  requireAdmin?: boolean;
  /** Forward without a token when nobody is signed in (public endpoints such as register). */
  allowAnonymous?: boolean;
}

function refuse(status: number, message: string) {
  return NextResponse.json({ message }, { status, headers: { "cache-control": "no-store" } });
}

export async function forwardToApi(request: NextRequest, { base, path = [], requireAdmin = false, allowAnonymous = false }: ForwardOptions) {
  // "." and ".." would let a caller step outside `base` on the backend.
  if (path.some((segment) => segment === "." || segment === "..")) {
    return refuse(400, "Invalid path");
  }

  // Writes must come from this app's own pages; a cross-site form or script is refused.
  if (request.method !== "GET" && request.method !== "HEAD") {
    const expected = new URL(process.env.NEXTAUTH_URL ?? request.nextUrl.origin).origin;
    if (request.headers.get("origin") !== expected) {
      return refuse(403, "Cross-origin request refused");
    }
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.accessToken;
  if (requireAdmin && (!accessToken || token?.role !== "admin")) {
    return refuse(401, "Not signed in");
  }
  if (!accessToken && !allowAnonymous) {
    return refuse(401, "Not signed in");
  }

  const headers = new Headers();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const suffix = path.length > 0 ? `/${path.map(encodeURIComponent).join("/")}` : "";
  let upstream: Response;
  try {
    upstream = await fetch(`${base}${suffix}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return refuse(502, "API unavailable");
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
}
