import fs from "fs";
import path from "path";
import type { PublicQueue, QueueState, Ticket } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "queue.json");

const DEFAULT_STATE: QueueState = {
  nextNumber: 1,
  tickets: [],
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
      };
    } else {
      persist();
    }
  } catch {
    store.state = { ...DEFAULT_STATE, tickets: [] };
  }
  store.loaded = true;
}

function persist() {
  const store = getStore();
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(store.state, null, 2), "utf-8");
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
  const { tickets } = getStore().state;
  const nowServing = tickets.find((t) => t.status === "serving") ?? null;
  const waiting = tickets.filter((t) => t.status === "waiting");
  const upNext = waiting.slice(0, 5);
  const recent = tickets
    .filter((t) => t.status === "done" || t.status === "skipped")
    .slice(-8)
    .reverse();
  return {
    nowServing,
    upNext,
    waiting,
    recent,
    all: [...tickets].reverse(),
  };
}

function nowIso() {
  return new Date().toISOString();
}

export function createTicket(name: string): Ticket {
  ensureLoaded();
  const store = getStore();
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned || !/^[A-Za-záéíóúüñÁÉÍÓÚÜÑ ]+$/.test(cleaned)) {
    throw new Error("Name must contain only letters and spaces");
  }
  if (cleaned.length > 40) {
    throw new Error("Name is too long (max 40 characters)");
  }

  const ticket: Ticket = {
    id: Date.now(),
    number: store.state.nextNumber,
    name: cleaned,
    status: "waiting",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };


  store.state.nextNumber += 1;
  store.state.tickets.push(ticket);
  persist();
  notify();
  return ticket;
}

export function advanceNext(): PublicQueue {
  ensureLoaded();
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

  persist();
  notify();
  return getPublicQueue();
}

export function skipTicket(number?: number): PublicQueue {
  ensureLoaded();
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

  persist();
  notify();
  return getPublicQueue();
}

export function recallTicket(number: number): PublicQueue {
  ensureLoaded();
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

  persist();
  notify();
  return getPublicQueue();
}

export function resetDay(): PublicQueue {
  ensureLoaded();
  const store = getStore();
  store.state = { nextNumber: 1, tickets: [] };
  persist();
  notify();
  return getPublicQueue();
}

export function sanitizeName(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().replace(/\s+/g, " ");
}
