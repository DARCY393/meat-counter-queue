import { NextResponse } from "next/server";
import { advanceNext } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const queue = advanceNext();
    return NextResponse.json({ queue });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to advance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
