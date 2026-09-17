import twilio from "twilio";
import { formatTicketNumber } from "./ticketFormat";

const DEFAULT_AHEAD = 2;

export function getSmsNotifyWhenAhead(): number {
  const raw = process.env.SMS_NOTIFY_WHEN_AHEAD;
  if (raw == null || raw === "") return DEFAULT_AHEAD;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_AHEAD;
  return n;
}

function twilioConfigured(): {
  sid: string;
  token: string;
  from: string;
} | null {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) return null;
  return { sid, token, from };
}

/** Short Spanish-first near-front SMS body */
export function buildNearFrontSmsBody(ticketNumber: number): string {
  const num = formatTicketNumber(ticketNumber);
  return `Cost+Plus: Su turno #${num} se acerca. Favor de venir a la carnicería. / Your #${num} is near — please come to the meat counter.`;
}

/**
 * Send one near-front SMS. Returns true if sent.
 * If Twilio env is missing, logs a warning and returns false (app still works).
 */
export async function sendNearFrontSms(
  toE164: string,
  ticketNumber: number
): Promise<boolean> {
  const cfg = twilioConfigured();
  if (!cfg) {
    console.warn(
      "[sms] Twilio not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER). Skipping SMS."
    );
    return false;
  }

  try {
    const client = twilio(cfg.sid, cfg.token);
    await client.messages.create({
      to: toE164,
      from: cfg.from,
      body: buildNearFrontSmsBody(ticketNumber),
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[sms] Failed to send to ${toE164.slice(0, 5)}…: ${message}`);
    return false;
  }
}
