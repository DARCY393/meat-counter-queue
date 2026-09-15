"use client";

import { useState } from "react";
import { formatTicketNumber, useQueue } from "@/lib/useQueue";
import type { Ticket } from "@/lib/types";

export default function CounterPage() {
  const { queue, connected } = useQueue();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function call(path: string, body?: object) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Action failed");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  function onReset() {
    if (
      !confirm(
        "Reset the day? This clears all tickets and starts numbering at 1 again."
      )
    ) {
      return;
    }
    void call("/api/reset");
  }

  const statusColor = (t: Ticket) => {
    switch (t.status) {
      case "serving":
        return "bg-amber-500 text-slate-950";
      case "waiting":
        return "bg-slate-700 text-white";
      case "skipped":
        return "bg-rose-900 text-rose-200";
      default:
        return "bg-slate-800 text-slate-400";
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black">Counter</h1>
          <p className="text-slate-400">
            Staff control ·{" "}
            <span className={connected ? "text-emerald-400" : "text-rose-400"}>
              {connected ? "live" : "offline"}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={busy}
          className="rounded-xl border border-rose-700 text-rose-300 hover:bg-rose-950 px-4 py-2 text-sm font-semibold"
        >
          Reset day
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 space-y-4">
          <div className="rounded-3xl bg-slate-900 border border-slate-700 p-6 text-center">
            <p className="text-slate-400 uppercase tracking-widest text-sm mb-2">
              Now serving
            </p>
            {queue.nowServing ? (
              <>
                <div className="text-7xl font-black text-amber-400 tabular-nums">
                  {formatTicketNumber(queue.nowServing.number)}
                </div>
                <p className="text-3xl font-semibold mt-2">
                  {queue.nowServing.name}
                </p>
              </>
            ) : (
              <p className="text-4xl text-slate-600 py-8">None</p>
            )}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => call("/api/next")}
            className="w-full rounded-3xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-5xl md:text-6xl py-16 shadow-2xl active:scale-[0.98] transition-transform"
          >
            NEXT
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy || !queue.nowServing}
              onClick={() => call("/api/skip")}
              className="rounded-2xl bg-rose-700 hover:bg-rose-600 disabled:opacity-40 py-5 text-xl font-bold"
            >
              Skip
            </button>
            <button
              type="button"
              disabled={busy || queue.recent.length === 0}
              onClick={() => {
                const last = queue.recent[0];
                if (last) void call("/api/recall", { number: last.number });
              }}
              className="rounded-2xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 py-5 text-xl font-bold"
            >
              Recall last
            </button>
          </div>

          {message && (
            <p className="text-rose-400 text-center font-semibold">{message}</p>
          )}
          <p className="text-slate-500 text-sm text-center">
            Waiting: {queue.waiting.length} · MVP stand-in for physical IP67
            switch (future GPIO / USB HID)
          </p>
        </section>

        <section className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-700 p-4 md:p-6">
          <h2 className="text-xl font-bold mb-4">Full queue</h2>
          {queue.all.length === 0 ? (
            <p className="text-slate-500 py-12 text-center text-lg">
              Queue empty — send customers to the kiosk
            </p>
          ) : (
            <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {queue.all.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-950 px-4 py-3"
                >
                  <span className="font-mono text-2xl font-bold tabular-nums w-20">
                    {formatTicketNumber(t.number)}
                  </span>
                  <span className="flex-1 text-xl font-semibold truncate">
                    {t.name}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${statusColor(
                      t
                    )}`}
                  >
                    {t.status}
                  </span>
                  {(t.status === "done" || t.status === "skipped") && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => call("/api/recall", { number: t.number })}
                      className="text-sm text-indigo-300 hover:text-indigo-200 font-semibold"
                    >
                      Recall
                    </button>
                  )}
                  {(t.status === "waiting" || t.status === "serving") && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => call("/api/skip", { number: t.number })}
                      className="text-sm text-rose-300 hover:text-rose-200 font-semibold"
                    >
                      Skip
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
