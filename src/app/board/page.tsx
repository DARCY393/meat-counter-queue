"use client";

import { useEffect, useRef } from "react";
import { formatTicketNumber, useQueue } from "@/lib/useQueue";

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // audio optional
  }
}

export default function BoardPage() {
  const { queue, connected } = useQueue();
  const prevServing = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    const servingNum = queue.nowServing?.number ?? null;
    if (prevServing.current === undefined) {
      prevServing.current = servingNum;
      return;
    }
    if (prevServing.current !== servingNum) {
      if (servingNum !== null) {
        playBeep();
      }
      prevServing.current = servingNum;
    }
  }, [queue.nowServing?.number]);

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10 flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-slate-300">
          MEAT COUNTER
        </h1>
        <span
          className={`text-sm font-mono px-3 py-1 rounded-full ${
            connected
              ? "bg-emerald-900 text-emerald-300"
              : "bg-rose-900 text-rose-300"
          }`}
        >
          {connected ? "LIVE" : "RECONNECTING…"}
        </span>
      </header>

      <section className="flex-1 grid md:grid-cols-5 gap-8 items-stretch">
        <div className="md:col-span-3 rounded-3xl bg-slate-950 border-4 border-amber-500 p-8 md:p-12 flex flex-col justify-center items-center shadow-[0_0_60px_rgba(245,158,11,0.25)]">
          <p className="text-amber-400 text-3xl md:text-5xl font-black tracking-[0.2em] uppercase mb-4">
            Now Serving
          </p>
          {queue.nowServing ? (
            <>
              <div className="text-[8rem] md:text-[14rem] leading-none font-black text-white tabular-nums">
                {formatTicketNumber(queue.nowServing.number)}
              </div>
              <p className="mt-6 text-4xl md:text-6xl font-semibold text-amber-200">
                {queue.nowServing.name}
              </p>
            </>
          ) : (
            <div className="text-5xl md:text-7xl font-bold text-slate-600 py-20">
              — —
            </div>
          )}
        </div>

        <div className="md:col-span-2 rounded-3xl bg-slate-900 border border-slate-700 p-6 md:p-8 flex flex-col">
          <p className="text-slate-300 text-2xl md:text-3xl font-bold tracking-widest uppercase mb-6">
            Up Next
          </p>
          {queue.upNext.length === 0 ? (
            <p className="text-slate-500 text-2xl flex-1 flex items-center">
              No one waiting
            </p>
          ) : (
            <ul className="space-y-4 flex-1">
              {queue.upNext.map((t, i) => (
                <li
                  key={t.id}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 ${
                    i === 0
                      ? "bg-slate-800 ring-2 ring-emerald-500"
                      : "bg-slate-950"
                  }`}
                >
                  <span className="text-4xl md:text-5xl font-black tabular-nums text-emerald-400">
                    {formatTicketNumber(t.number)}
                  </span>
                  <span className="text-2xl md:text-3xl font-semibold truncate ml-4">
                    {t.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-slate-500 text-sm">
            Waiting: {queue.waiting.length}
          </p>
        </div>
      </section>
    </main>
  );
}
