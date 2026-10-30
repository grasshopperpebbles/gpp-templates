import { type NextRequest, NextResponse } from "next/server";
import { forwardToApi } from "@/lib/forward";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "";

// POST /api/graphql on this app -> GRAPHQL_ENDPOINT, with the admin's token.
export async function POST(request: NextRequest) {
  if (!GRAPHQL_ENDPOINT) {
    return NextResponse.json({ message: "GraphQL endpoint not configured. Set GRAPHQL_ENDPOINT." }, { status: 501 });
  }
  return forwardToApi(request, { base: GRAPHQL_ENDPOINT, requireAdmin: true });
}
