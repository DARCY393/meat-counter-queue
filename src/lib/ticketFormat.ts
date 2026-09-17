export function formatTicketNumber(n: number): string {
  return String(n).padStart(3, "0");
}
