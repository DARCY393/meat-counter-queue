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
}

export interface PublicQueue {
  nowServing: Ticket | null;
  upNext: Ticket[];
  waiting: Ticket[];
  recent: Ticket[];
  all: Ticket[];
}
