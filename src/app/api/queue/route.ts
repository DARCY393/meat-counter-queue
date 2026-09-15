import { NextResponse } from "next/server";
import { getPublicQueue } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ queue: getPublicQueue() });
}
