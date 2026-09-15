import { NextResponse } from "next/server";
import { recallTicket } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const number = body?.number;
    if (typeof number !== "number") {
      return NextResponse.json(
        { error: "Ticket number required" },
        { status: 400 }
      );
    }
    const queue = recallTicket(number);
    return NextResponse.json({ queue });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to recall";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
