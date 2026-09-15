"use client";

import { FormEvent, useState } from "react";
import { formatTicketNumber } from "@/lib/useQueue";

type Issued = { number: number; name: string };

export default function KioskPage() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);

  const lettersOnly = (value: string) =>
    value.replace(/[^A-Za-z ]/g, "").slice(0, 40);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = name.trim().replace(/\s+/g, " ");
    if (!cleaned) {
      setError("Please enter your name");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not get a number");
        return;
      }
      setIssued({ number: data.ticket.number, name: data.ticket.name });
      setName("");
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setIssued(null);
    setError(null);
    setName("");
  }

  if (issued) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-slate-400 text-2xl md:text-3xl mb-4 uppercase tracking-widest">
          Your number
        </p>
        <div className="text-[9rem] md:text-[12rem] leading-none font-black text-amber-400 tabular-nums">
          {formatTicketNumber(issued.number)}
        </div>
        <p className="mt-6 text-3xl md:text-5xl font-semibold">{issued.name}</p>
        <p className="mt-4 text-slate-400 text-xl">
          Please watch the board for your turn
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-12 rounded-2xl bg-slate-800 hover:bg-slate-700 px-10 py-5 text-2xl font-bold"
        >
          Next customer
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl md:text-6xl font-black mb-2 text-center">
        Meat Counter
      </h1>
      <p className="text-slate-400 text-xl md:text-2xl mb-10 text-center">
        Enter your name to get a number
      </p>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl flex flex-col gap-6"
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(lettersOnly(e.target.value))}
          placeholder="First name"
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          className="w-full rounded-3xl bg-slate-900 border-4 border-slate-700 focus:border-amber-400 px-8 py-8 text-4xl md:text-6xl font-bold text-center placeholder:text-slate-600"
        />
        {error && (
          <p className="text-rose-400 text-center text-xl font-semibold">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-3xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 px-8 py-8 text-3xl md:text-5xl font-black shadow-xl"
        >
          {busy ? "Getting number…" : "Get number"}
        </button>
      </form>
      <p className="mt-8 text-slate-500 text-sm">Letters and spaces only</p>
    </main>
  );
}
