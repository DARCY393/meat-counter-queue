"use client";

import { useEffect, useRef } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLang } from "@/lib/i18n";
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
  const { lang, setLang, t } = useLang();
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
    <main className="min-h-screen bg-cp-red-dark text-white p-6 md:p-10 flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <BrandMark size="sm" />
          <div className="hidden sm:block h-10 w-px bg-cp-yellow/40" />
          <h1 className="text-xl md:text-2xl font-bold tracking-wide text-cp-yellow uppercase">
            {t.meatCounter}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle lang={lang} onChange={setLang} />
          <span
            className={`text-sm font-mono px-3 py-1 rounded-full font-bold ${
              connected
                ? "bg-cp-yellow text-cp-red-deep"
                : "bg-black/40 text-cp-yellow"
            }`}
          >
            {connected ? t.live : t.reconnecting}
          </span>
        </div>
      </header>

      <section className="flex-1 grid md:grid-cols-5 gap-8 items-stretch">
        <div className="md:col-span-3 rounded-3xl bg-cp-red border-4 border-cp-yellow p-8 md:p-12 flex flex-col justify-center items-center shadow-[0_0_60px_rgba(255,210,0,0.35)]">
          <p className="text-cp-yellow text-3xl md:text-5xl font-black tracking-[0.15em] uppercase mb-4">
            {t.nowServing}
          </p>
          {lang === "es" && (
            <p className="text-white/50 text-sm md:text-base tracking-[0.3em] uppercase mb-2">
              Now Serving
            </p>
          )}
          {queue.nowServing ? (
            <>
              <div className="text-[8rem] md:text-[14rem] leading-none font-black tabular-nums cp-number">
                {formatTicketNumber(queue.nowServing.number)}
              </div>
              <p className="mt-6 text-4xl md:text-6xl font-semibold text-white">
                {queue.nowServing.name}
              </p>
            </>
          ) : (
            <div className="text-5xl md:text-7xl font-bold text-white/30 py-20">
              — —
            </div>
          )}
        </div>

        <div className="md:col-span-2 rounded-3xl bg-cp-red-deep border-2 border-cp-yellow/50 p-6 md:p-8 flex flex-col">
          <p className="text-cp-yellow text-2xl md:text-3xl font-bold tracking-widest uppercase mb-2">
            {t.upNext}
          </p>
          {lang === "es" && (
            <p className="text-white/40 text-xs tracking-[0.25em] uppercase mb-4">
              Up Next
            </p>
          )}
          {queue.upNext.length === 0 ? (
            <p className="text-white/50 text-2xl flex-1 flex items-center">
              {t.noOneWaiting}
            </p>
          ) : (
            <ul className="space-y-4 flex-1">
              {queue.upNext.map((ticket, i) => (
                <li
                  key={ticket.id}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 ${
                    i === 0
                      ? "bg-cp-yellow text-cp-red-deep ring-2 ring-white"
                      : "bg-black/30"
                  }`}
                >
                  <span
                    className={`text-4xl md:text-5xl font-black tabular-nums ${
                      i === 0 ? "text-cp-red-deep" : "text-cp-yellow"
                    }`}
                  >
                    {formatTicketNumber(ticket.number)}
                  </span>
                  <span className="text-2xl md:text-3xl font-semibold truncate ml-4">
                    {ticket.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-cp-yellow/70 text-sm font-semibold">
            {t.waiting}: {queue.waiting.length}
          </p>
        </div>
      </section>
    </main>
  );
}
