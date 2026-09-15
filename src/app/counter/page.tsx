"use client";

import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLang } from "@/lib/i18n";
import { formatTicketNumber, useQueue } from "@/lib/useQueue";
import type { Ticket } from "@/lib/types";

export default function CounterPage() {
  const { queue, connected } = useQueue();
  const { lang, setLang, t } = useLang();
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
        setMessage(data.error || t.actionFailed);
      }
    } catch {
      setMessage(t.networkErrorShort);
    } finally {
      setBusy(false);
    }
  }

  function onReset() {
    if (!confirm(t.resetConfirm)) {
      return;
    }
    void call("/api/reset");
  }

  const statusLabel = (status: Ticket["status"]) => {
    switch (status) {
      case "serving":
        return t.statusServing;
      case "waiting":
        return t.statusWaiting;
      case "done":
        return t.statusDone;
      case "skipped":
        return t.statusSkipped;
      default:
        return status;
    }
  };

  const statusColor = (ticket: Ticket) => {
    switch (ticket.status) {
      case "serving":
        return "bg-cp-yellow text-cp-red-deep";
      case "waiting":
        return "bg-black/40 text-cp-yellow";
      case "skipped":
        return "bg-black/50 text-rose-200";
      default:
        return "bg-black/30 text-white/60";
    }
  };

  return (
    <main className="min-h-screen bg-cp-red-dark text-white p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <BrandMark size="sm" showSupermarket={false} />
          <div>
            <h1 className="text-3xl font-black">{t.counter}</h1>
            <p className="text-cp-yellow/80">
              {t.staffControl} ·{" "}
              <span className={connected ? "text-cp-yellow" : "text-rose-300"}>
                {connected ? t.liveLower : t.offline}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle lang={lang} onChange={setLang} />
          <button
            type="button"
            onClick={onReset}
            disabled={busy}
            className="rounded-xl border-2 border-cp-yellow/60 text-cp-yellow hover:bg-cp-red px-4 py-2 text-sm font-semibold"
          >
            {t.resetDay}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 space-y-4">
          <div className="rounded-3xl bg-cp-red border-2 border-cp-yellow/50 p-6 text-center">
            <p className="text-cp-yellow uppercase tracking-widest text-sm mb-2 font-bold">
              {t.nowServing}
            </p>
            {queue.nowServing ? (
              <>
                <div className="text-7xl font-black tabular-nums cp-number">
                  {formatTicketNumber(queue.nowServing.number)}
                </div>
                <p className="text-3xl font-semibold mt-2">
                  {queue.nowServing.name}
                </p>
              </>
            ) : (
              <p className="text-4xl text-white/40 py-8">{t.none}</p>
            )}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => call("/api/next")}
            className="w-full rounded-3xl bg-cp-yellow hover:bg-cp-yellow-deep disabled:opacity-50 text-cp-red-deep font-black text-5xl md:text-6xl py-16 shadow-2xl active:scale-[0.98] transition-transform"
          >
            {t.next}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy || !queue.nowServing}
              onClick={() => call("/api/skip")}
              className="rounded-2xl bg-black/40 hover:bg-black/60 border border-cp-yellow/40 disabled:opacity-40 py-5 text-xl font-bold text-cp-yellow"
            >
              {t.skip}
            </button>
            <button
              type="button"
              disabled={busy || queue.recent.length === 0}
              onClick={() => {
                const last = queue.recent[0];
                if (last) void call("/api/recall", { number: last.number });
              }}
              className="rounded-2xl bg-black/40 hover:bg-black/60 border border-cp-yellow/40 disabled:opacity-40 py-5 text-xl font-bold text-cp-yellow"
            >
              {t.recallLast}
            </button>
          </div>

          {message && (
            <p className="text-cp-yellow text-center font-semibold">{message}</p>
          )}
          <p className="text-white/50 text-sm text-center">
            {t.waiting}: {queue.waiting.length} · {t.mvpSwitchNote}
          </p>
        </section>

        <section className="lg:col-span-2 rounded-3xl bg-cp-red border-2 border-cp-yellow/40 p-4 md:p-6">
          <h2 className="text-xl font-bold mb-4 text-cp-yellow">{t.fullQueue}</h2>
          {queue.all.length === 0 ? (
            <p className="text-white/50 py-12 text-center text-lg">
              {t.queueEmpty}
            </p>
          ) : (
            <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {queue.all.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex items-center gap-3 rounded-xl bg-black/30 px-4 py-3"
                >
                  <span className="font-mono text-2xl font-bold tabular-nums w-20 text-cp-yellow">
                    {formatTicketNumber(ticket.number)}
                  </span>
                  <span className="flex-1 text-xl font-semibold truncate">
                    {ticket.name}
                  </span>
                  <span
                    className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${statusColor(
                      ticket
                    )}`}
                  >
                    {statusLabel(ticket.status)}
                  </span>
                  {(ticket.status === "done" || ticket.status === "skipped") && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        call("/api/recall", { number: ticket.number })
                      }
                      className="text-sm text-cp-yellow hover:text-white font-semibold"
                    >
                      {t.recall}
                    </button>
                  )}
                  {(ticket.status === "waiting" ||
                    ticket.status === "serving") && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        call("/api/skip", { number: ticket.number })
                      }
                      className="text-sm text-rose-200 hover:text-white font-semibold"
                    >
                      {t.skip}
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
