import { NextResponse } from "next/server";
import { resetDay } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const queue = resetDay();
    return NextResponse.json({ queue });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
