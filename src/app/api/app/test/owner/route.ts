import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth-guard";

export async function GET() {
  const result = await requireOwner();

  if ("response" in result) {
    return result.response;
  }

  return NextResponse.json({
    ok: true,
    userId: result.session.user.id,
    isOwner: result.session.user.isOwner,
  });
}
