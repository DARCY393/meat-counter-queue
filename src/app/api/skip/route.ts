import { NextResponse } from "next/server";
import { skipTicket } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const number =
      typeof body?.number === "number" ? body.number : undefined;
    const queue = skipTicket(number);
    return NextResponse.json({ queue });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to skip";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
