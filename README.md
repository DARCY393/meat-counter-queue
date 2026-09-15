# Meat Counter Queue

Walk-up ticketing MVP for a meat counter. Three browser views on one local Node process — no accounts, high-contrast signage UI, live updates over SSE.

## Views

| URL | Purpose |
|-----|---------|
| `/kiosk` | Customer walk-up: enter name (letters/spaces), tap **Get number** |
| `/board` | TV behind the counter: **NOW SERVING** + **UP NEXT** (SSE + optional beep) |
| `/counter` | Staff: full queue, huge **NEXT**, Skip / Recall, Reset day |

Home page `/` links to all three.

## Behavior

- Ticket numbers start at **1** and increment; persisted in `data/queue.json` across restarts.
- States: `waiting` → `serving` → `done` (or `skipped`).
- **NEXT**: current serving → done; next waiting → serving; if nobody waiting, clears NOW SERVING.
- **Reset day** (counter, with confirm): clears tickets and renumbers from 1.
- Live board/counter via `GET /api/events` (Server-Sent Events).

## API

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/tickets` | `{ "name": "Alex" }` | Issue ticket |
| `POST` | `/api/next` | — | Advance queue |
| `GET` | `/api/queue` | — | Snapshot |
| `POST` | `/api/reset` | — | Reset day |
| `POST` | `/api/skip` | `{ "number"?: n }` | Skip serving or ticket `n` |
| `POST` | `/api/recall` | `{ "number": n }` | Recall done/skipped ticket |
| `GET` | `/api/events` | — | SSE stream (`event: queue`) |

## Run on a small on-site PC

Requirements: Node.js 18+ (20 recommended), npm.

```bash
cd meat-counter-queue
npm install
npm run build
npm start
```

App listens on **http://localhost:3000** (or set `PORT`).

### Demo setup (three windows)

1. Open **http://\<pc-ip\>:3000/kiosk** on a tablet / touch screen facing customers.
2. Open **http://\<pc-ip\>:3000/board** fullscreen on the TV behind the counter.
3. Open **http://\<pc-ip\>:3000/counter** on the staff machine.

Flow: enter names on kiosk → press **NEXT** on counter → board updates live (beep when NOW SERVING changes).

For LAN access, bind all interfaces if needed:

```bash
HOSTNAME=0.0.0.0 npm start
```

## Development

```bash
npm run dev
```

## Data

Queue state lives in `data/queue.json`. The file is created automatically. Do not commit live queue data.

## Physical switch (future)

The counter **NEXT** button stands in for a rugged IP67 foot/hand switch. Future work: map a GPIO or USB HID button on the on-site PC to `POST /api/next` (or a tiny local agent that fires the same endpoint). No hardware integration in this MVP.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Single Node process; in-memory store + JSON file under `data/`
- SSE for live signage / counter refresh

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |
