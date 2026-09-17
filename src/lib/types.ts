export type TicketStatus = "waiting" | "serving" | "done" | "skipped";

export interface Ticket {
  id: number;
  number: number;
  name: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  /** E.164 phone when customer opted in for SMS near-front notify */
  phone?: string;
  /** ISO timestamp when SMS consent was given */
  smsConsentAt?: string;
  /** ISO timestamp when near-front SMS was sent; null/undefined until sent */
  smsNotifiedAt?: string | null;
}

/** Client-facing ticket without phone / consent fields */
export type PublicTicket = Omit<
  Ticket,
  "phone" | "smsConsentAt" | "smsNotifiedAt"
>;

export interface QueueState {
  nextNumber: number;
  tickets: Ticket[];
  /** Calendar date YYYY-MM-DD in store timezone; used for midnight auto-reset */
  businessDate?: string;
}

export interface PublicQueue {
  nowServing: PublicTicket | null;
  upNext: PublicTicket[];
  waiting: PublicTicket[];
  recent: PublicTicket[];
  all: PublicTicket[];
  businessDate?: string;
}
