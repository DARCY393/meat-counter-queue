import fs from "fs";
import path from "path";
import { normalizeUsPhone } from "./phone";
import { getSmsNotifyWhenAhead, sendNearFrontSms } from "./sms";
import type { PublicQueue, PublicTicket, QueueState, Ticket } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "queue.json");

const QUEUE_TZ = process.env.QUEUE_TZ || "America/Chicago";

function businessDateNow(): string {
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: QUEUE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}


const DEFAULT_STATE: QueueState = {
  nextNumber: 1,
  tickets: [],
  businessDate: undefined,
};

type Listener = (queue: PublicQueue) => void;

declare global {
  // eslint-disable-next-line no-var
  var __meatCounterStore: {
    state: QueueState;
    listeners: Set<Listener>;
    loaded: boolean;
  } | undefined;
}

function getStore() {
  if (!global.__meatCounterStore) {
    global.__meatCounterStore = {
      state: { ...DEFAULT_STATE, tickets: [] },
      listeners: new Set(),
      loaded: false,
    };
  }
  return global.__meatCounterStore;
}

function ensureLoaded() {
  const store = getStore();
  if (store.loaded) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw) as QueueState;
      store.state = {
        nextNumber: parsed.nextNumber ?? 1,
        tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
        businessDate: parsed.businessDate,
      };
    } else {
      persist();
    }
  } catch {
    store.state = { ...DEFAULT_STATE, tickets: [] };
  }
  store.loaded = true;
  ensureBusinessDay();
  startMidnightWatcher();
}

function persist() {
  const store = getStore();
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(store.state, null, 2), "utf-8");
}


let midnightTimer: ReturnType<typeof setInterval> | null = null;

function startMidnightWatcher() {
  if (midnightTimer) return;
  midnightTimer = setInterval(() => {
    try {
      ensureLoaded();
      ensureBusinessDay();
    } catch {
      // ignore
    }
  }, 30_000);
}

function ensureBusinessDay() {
  const store = getStore();
  const today = businessDateNow();
  if (!store.state.businessDate) {
    store.state.businessDate = today;
    persist();
    return;
  }
  if (store.state.businessDate !== today) {
    store.state = { nextNumber: 1, tickets: [], businessDate: today };
    persist();
    notify();
  }
}

function toPublicTicket(ticket: Ticket): PublicTicket {
  return {
    id: ticket.id,
    number: ticket.number,
    name: ticket.name,
    status: ticket.status,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

function notify() {
  const store = getStore();
  const queue = getPublicQueue();
  store.listeners.forEach((listener) => {
    try {
      listener(queue);
    } catch {
      // ignore broken listeners
    }
  });
}

/**
 * After waiting-order mutations: if a consented waiting ticket has
 * waiting-index < SMS_NOTIFY_WHEN_AHEAD (default 2), send ONE SMS and set smsNotifiedAt.
 * Position 0 = first waiting (next to be served after current serving clears).
 */
async function maybeNotifyNearFront(): Promise<void> {
  ensureLoaded();
  const store = getStore();
  const waiting = store.state.tickets.filter((t) => t.status === "waiting");
  const threshold = getSmsNotifyWhenAhead();
  let changed = false;

  for (let i = 0; i < waiting.length && i < threshold; i++) {
    const ticket = waiting[i];
    if (!ticket.phone || !ticket.smsConsentAt || ticket.smsNotifiedAt) {
      continue;
    }
    const sent = await sendNearFrontSms(ticket.phone, ticket.number);
    if (sent) {
      ticket.smsNotifiedAt = nowIso();
      ticket.updatedAt = ticket.smsNotifiedAt;
      changed = true;
    }
  }

  if (changed) {
    persist();
    notify();
  }
}

function afterWaitingOrderChange() {
  persist();
  notify();
  void maybeNotifyNearFront().catch((err) => {
    console.warn("[sms] near-front notify error:", err);
  });
}

export function subscribe(listener: Listener): () => void {
  ensureLoaded();
  const store = getStore();
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

export function getPublicQueue(): PublicQueue {
  ensureLoaded();
  ensureBusinessDay();
  const { tickets, businessDate } = getStore().state;
  const nowServingRaw = tickets.find((t) => t.status === "serving") ?? null;
  const waitingRaw = tickets.filter((t) => t.status === "waiting");
  const upNext = waitingRaw.slice(0, 5).map(toPublicTicket);
  const recent = tickets
    .filter((t) => t.status === "done" || t.status === "skipped")
    .slice(-8)
    .reverse()
    .map(toPublicTicket);
  return {
    nowServing: nowServingRaw ? toPublicTicket(nowServingRaw) : null,
    upNext,
    waiting: waitingRaw.map(toPublicTicket),
    recent,
    all: [...tickets].reverse().map(toPublicTicket),
    businessDate,
  };
}

function nowIso() {
  return new Date().toISOString();
}

export type CreateTicketInput = {
  name: string;
  phone?: string | null;
  smsConsent?: boolean;
};

export function createTicket(input: CreateTicketInput | string): Ticket {
  ensureLoaded();
  ensureBusinessDay();
  const store = getStore();

  const opts: CreateTicketInput =
    typeof input === "string" ? { name: input } : input;

  const cleaned = opts.name.trim().replace(/\s+/g, " ");
  if (!cleaned || !/^[A-Za-záéíóúüñÁÉÍÓÚÜÑ ]+$/.test(cleaned)) {
    throw new Error("Name must contain only letters and spaces");
  }
  if (cleaned.length > 40) {
    throw new Error("Name is too long (max 40 characters)");
  }

  const rawPhone =
    typeof opts.phone === "string" && opts.phone.trim() ? opts.phone : null;
  let phone: string | undefined;
  let smsConsentAt: string | undefined;

  if (rawPhone) {
    if (!opts.smsConsent) {
      throw new Error("SMS consent is required when a phone number is provided");
    }
    const normalized = normalizeUsPhone(rawPhone);
    if (!normalized) {
      throw new Error("Invalid US phone number");
    }
    phone = normalized;
    smsConsentAt = nowIso();
  }

  const ticket: Ticket = {
    id: Date.now(),
    number: store.state.nextNumber,
    name: cleaned,
    status: "waiting",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...(phone
      ? { phone, smsConsentAt, smsNotifiedAt: null }
      : {}),
  };

  store.state.nextNumber += 1;
  store.state.tickets.push(ticket);
  afterWaitingOrderChange();
  return ticket;
}

export function advanceNext(): PublicQueue {
  ensureLoaded();
  ensureBusinessDay();
  const store = getStore();
  const ts = nowIso();

  const serving = store.state.tickets.find((t) => t.status === "serving");
  if (serving) {
    serving.status = "done";
    serving.updatedAt = ts;
  }

  const nextWaiting = store.state.tickets.find((t) => t.status === "waiting");
  if (nextWaiting) {
    nextWaiting.status = "serving";
    nextWaiting.updatedAt = ts;
  }

  afterWaitingOrderChange();
  return getPublicQueue();
}

export function skipTicket(number?: number): PublicQueue {
  ensureLoaded();
  ensureBusinessDay();
  const store = getStore();
  const ts = nowIso();

  const target =
    typeof number === "number"
      ? store.state.tickets.find(
          (t) =>
            t.number === number &&
            (t.status === "waiting" || t.status === "serving")
        )
      : store.state.tickets.find((t) => t.status === "serving");

  if (!target) {
    throw new Error("No ticket to skip");
  }

  const wasServing = target.status === "serving";
  target.status = "skipped";
  target.updatedAt = ts;

  if (wasServing) {
    const nextWaiting = store.state.tickets.find((t) => t.status === "waiting");
    if (nextWaiting) {
      nextWaiting.status = "serving";
      nextWaiting.updatedAt = ts;
    }
  }

  afterWaitingOrderChange();
  return getPublicQueue();
}

export function recallTicket(number: number): PublicQueue {
  ensureLoaded();
  ensureBusinessDay();
  const store = getStore();
  const ts = nowIso();
  const ticket = store.state.tickets.find((t) => t.number === number);
  if (!ticket) {
    throw new Error("Ticket not found");
  }
  if (ticket.status !== "done" && ticket.status !== "skipped") {
    throw new Error("Only finished or skipped tickets can be recalled");
  }

  const currentServing = store.state.tickets.find((t) => t.status === "serving");
  if (currentServing) {
    currentServing.status = "waiting";
    currentServing.updatedAt = ts;
    // Move demoted ticket to front of waiting order
    store.state.tickets = store.state.tickets.filter((t) => t !== currentServing);
    const insertAt = store.state.tickets.findIndex((t) => t.status === "waiting");
    if (insertAt === -1) {
      store.state.tickets.push(currentServing);
    } else {
      store.state.tickets.splice(insertAt, 0, currentServing);
    }
  }

  ticket.status = "serving";
  ticket.updatedAt = ts;

  afterWaitingOrderChange();
  return getPublicQueue();
}

export function resetDay(): PublicQueue {
  ensureLoaded();
  const store = getStore();
  store.state = { nextNumber: 1, tickets: [], businessDate: businessDateNow() };
  persist();
  notify();
  return getPublicQueue();
}

export function getQueueTimezone(): string {
  return QUEUE_TZ;
}

export function sanitizeName(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().replace(/\s+/g, " ");
}
