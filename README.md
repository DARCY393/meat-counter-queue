# Cost+Plus Meat Counter Queue / Carnicería

Walk-up ticketing MVP for **Cost+Plus** supermarket meat counter (carnicería). Three browser views on one local Node process — no accounts, high-contrast yellow/red signage UI, live updates over SSE.

**Branding:** Cost+Plus yellow (`#FFD200` / `#F5C518`) and red (`#E30613` / `#C8102E`). Store wordmark + optional reference image at `public/branding-costplus.png` (supplied asset; not a third-party logo reproduction beyond that screenshot).

**Language:** Spanish-first (`es` default). EN | ES toggle on home, kiosk, board, and counter. Preference persisted in `localStorage` key `mcp-lang` (`src/lib/i18n.ts`).

## Views

| URL | Purpose |
|-----|---------|
| `/kiosk` | Customer walk-up: enter name (letters incl. áéíóúüñ + spaces), optional phone + SMS consent, tap **Get number** / **Obtener número** |
| `/board` | TV behind the counter: **Ahora sirviendo** / **Now Serving** + **Siguientes** / **Up Next** (SSE + optional beep). Phone numbers are never shown. |
| `/counter` | Staff: full queue, huge **SIGUIENTE** / **NEXT**, Skip / Recall, Reset day. Phone numbers omitted from the UI. |

Home page `/` links to all three.

## Behavior

- Ticket numbers start at **1** and increment; persisted in `data/queue.json` across restarts.
- States: `waiting` → `serving` → `done` (or `skipped`). Labels localize to En espera / Sirviendo / Listo.
- **NEXT**: current serving → done; next waiting → serving; if nobody waiting, clears NOW SERVING.
- **Reset day** (counter, with confirm): clears tickets and renumbers from 1.
- **Auto midnight reset**: queue clears and numbering restarts at 1 when the calendar day changes in `QUEUE_TZ` (default `America/Chicago`). Manual reset still available. Checks every 30s and on each API action.
- Live board/counter via `GET /api/events` (Server-Sent Events).
- Names allow Spanish letters: `A-Za-z` plus `áéíóúüñÁÉÍÓÚÜÑ` and spaces.

### Optional SMS near-front notify

On the kiosk, customers may enter a US mobile number. If a phone is entered, they must check a consent box agreeing to receive an SMS when near the front of the line.

- Phone is normalized to E.164 (`+1…`) and stored on the ticket with `smsConsentAt` (ISO) and `smsNotifiedAt` (null until sent).
- After queue mutations that change waiting order (`create`, `next`, `skip`, `recall`), the server checks the **waiting** array.
- **Position** = index in the waiting array (`0` = first waiting = next to be served after the current serving clears).
- If a waiting ticket has consent + phone, `smsNotifiedAt` is unset, and **waiting index &lt; `SMS_NOTIFY_WHEN_AHEAD`**, one SMS is sent via Twilio and `smsNotifiedAt` is set. Default threshold **N = 2** (the first two waiting people enter the notify window).
- SMS body is Spanish-first, includes the ticket number, and asks the customer to come to the carnicería / meat counter.
- If Twilio env vars are missing, the app still works; sends are skipped with a server warning log.
- Public queue payloads (board / counter / SSE) strip phone and consent fields so numbers are never displayed on `/board` or `/counter`.

## API

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/tickets` | `{ "name": "Alex", "phone"?: "+15551234567", "smsConsent"?: true }` | Issue ticket. If `phone` is present, `smsConsent` must be `true`. |
| `POST` | `/api/next` | — | Advance queue |
| `GET` | `/api/queue` | — | Snapshot (phones stripped) |
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

Flow: enter names on kiosk → press **NEXT** / **SIGUIENTE** on counter → board updates live (beep when NOW SERVING changes). Use the **EN | ES** toggle on any screen; default is Spanish.

For LAN access, bind all interfaces if needed:

```bash
HOSTNAME=0.0.0.0 npm start
```

## Development

```bash
npm run dev
```

### Testing SMS near-front notify

1. Set Twilio env vars (see below) and optionally `SMS_NOTIFY_WHEN_AHEAD=2`.
2. `npm run dev`
3. On `/kiosk`, create tickets with phone + consent checked (use a number you control in Twilio trial).
4. Create enough waiting tickets that someone sits at waiting index 0 or 1 (with default N=2).
5. Press **NEXT** / skip / recall on `/counter` and confirm exactly one SMS arrives; `data/queue.json` should show `smsNotifiedAt` set for that ticket.
6. Unset Twilio vars and confirm the app still runs (warning in server logs, no crash).

## Data

Queue state lives in `data/queue.json`. The file is created automatically. Do not commit live queue data. Tickets may include `phone`, `smsConsentAt`, and `smsNotifiedAt` on disk only — never commit secrets or production queue dumps.

## Physical switch (future)

The counter **NEXT** button stands in for a rugged IP67 foot/hand switch. Future work: map a GPIO or USB HID button on the on-site PC to `POST /api/next` (or a tiny local agent that fires the same endpoint). No hardware integration in this MVP.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Single Node process; in-memory store + JSON file under `data/`
- SSE for live signage / counter refresh
- Client i18n (`en` / `es`) via `src/lib/i18n.ts`
- Optional Twilio SMS (`twilio` package) for near-front notify

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |

## Environment

| Variable | Default | Meaning |
|----------|---------|---------|
| `PORT` | `3000` | HTTP port |
| `HOSTNAME` | (Next default) | Set `0.0.0.0` for LAN |
| `QUEUE_TZ` | `America/Chicago` | Timezone for midnight auto-reset |
| `TWILIO_ACCOUNT_SID` | — | Twilio Account SID (optional; SMS skipped if unset) |
| `TWILIO_AUTH_TOKEN` | — | Twilio Auth Token (optional) |
| `TWILIO_FROM_NUMBER` | — | Twilio from number in E.164 (optional) |
| `SMS_NOTIFY_WHEN_AHEAD` | `2` | Notify when waiting index &lt; N (N=2 → first two waiting) |

Never commit `.env` / secrets. Local env files are gitignored.
