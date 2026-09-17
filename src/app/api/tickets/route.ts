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

    const phoneRaw =
      typeof body?.phone === "string" ? body.phone.trim() : "";
    const smsConsent = body?.smsConsent === true;

    if (phoneRaw && !smsConsent) {
      return NextResponse.json(
        { error: "SMS consent is required when a phone number is provided" },
        { status: 400 }
      );
    }

    const ticket = createTicket({
      name,
      phone: phoneRaw || undefined,
      smsConsent: phoneRaw ? smsConsent : undefined,
    });

    // Return ticket without exposing consent internals unnecessarily;
    // phone is fine for the customer who just entered it.
    return NextResponse.json({
      ticket: {
        id: ticket.id,
        number: ticket.number,
        name: ticket.name,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        ...(ticket.phone ? { phone: ticket.phone } : {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create ticket";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
