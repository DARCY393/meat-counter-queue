export type TicketStatus = "waiting" | "serving" | "done" | "skipped";

export interface Ticket {
  id: number;
  number: number;
  name: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QueueState {
  nextNumber: number;
  tickets: Ticket[];
  /** Calendar date YYYY-MM-DD in store timezone; used for midnight auto-reset */
  businessDate?: string;
}

export interface PublicQueue {
  nowServing: Ticket | null;
  upNext: Ticket[];
  waiting: Ticket[];
  recent: Ticket[];
  all: Ticket[];
  businessDate?: string;
}
