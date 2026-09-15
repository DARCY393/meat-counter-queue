import { NextResponse } from "next/server";
import { createTicket, sanitizeName } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = sanitizeName(body?.name);
    if (!name) {
      return NextResponse.json(
        { error: "Please enter a name (letters and spaces only)" },
        { status: 400 }
      );
    }
    const ticket = createTicket(name);
    return NextResponse.json({ ticket });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create ticket";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
