/**
 * Normalize a US phone to E.164 (+1XXXXXXXXXX).
 * Accepts 10-digit local, 11-digit with leading 1, or already +1….
 * Returns null if invalid / empty.
 */
export function normalizeUsPhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");
  let national: string | null = null;

  if (digits.length === 10) {
    national = digits;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    national = digits.slice(1);
  } else {
    return null;
  }

  // US NANP: area code cannot start with 0 or 1
  if (national[0] === "0" || national[0] === "1") return null;
  if (national[3] === "0" || national[3] === "1") return null;

  return `+1${national}`;
}

/** Mask E.164 for staff UI if ever shown: ••••1234 */
export function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return last4 ? `••••${last4}` : "••••";
}
