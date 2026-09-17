"use client";

import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { filterNameInput, useLang } from "@/lib/i18n";
import { formatTicketNumber } from "@/lib/useQueue";

type Issued = { number: number; name: string };

export default function KioskPage() {
  const { lang, setLang, t } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);

  const phoneEntered = phone.trim().length > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = name.trim().replace(/\s+/g, " ");
    if (!cleaned) {
      setError(t.pleaseEnterName);
      return;
    }
    if (phoneEntered && !smsConsent) {
      setError(t.phoneRequiresConsent);
      return;
    }
    setBusy(true);
    try {
      const payload: {
        name: string;
        phone?: string;
        smsConsent?: boolean;
      } = { name: cleaned };
      if (phoneEntered) {
        payload.phone = phone.trim();
        payload.smsConsent = true;
      }
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || t.couldNotGetNumber;
        if (typeof msg === "string" && /phone|celular|invalid/i.test(msg)) {
          setError(t.invalidPhone);
        } else if (
          typeof msg === "string" &&
          /consent/i.test(msg)
        ) {
          setError(t.phoneRequiresConsent);
        } else {
          setError(msg);
        }
        return;
      }
      setIssued({ number: data.ticket.number, name: data.ticket.name });
      setName("");
      setPhone("");
      setSmsConsent(false);
    } catch {
      setError(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setIssued(null);
    setError(null);
    setName("");
    setPhone("");
    setSmsConsent(false);
  }

  if (issued) {
    return (
      <main className="min-h-screen bg-cp-red-deep text-white flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4">
          <LanguageToggle lang={lang} onChange={setLang} />
        </div>
        <BrandMark size="sm" className="mb-8 items-center" />
        <p className="text-cp-yellow text-2xl md:text-3xl mb-4 uppercase tracking-widest font-bold">
          {t.yourNumber}
        </p>
        <div className="text-[9rem] md:text-[12rem] leading-none font-black tabular-nums cp-number">
          {formatTicketNumber(issued.number)}
        </div>
        <p className="mt-6 text-3xl md:text-5xl font-semibold">{issued.name}</p>
        <p className="mt-4 text-cp-yellow/80 text-xl text-center max-w-lg">
          {t.pleaseWatchBoard}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-12 rounded-2xl bg-cp-yellow hover:bg-cp-yellow-deep text-cp-red-deep px-10 py-5 text-2xl font-black shadow-xl"
        >
          {t.nextCustomer}
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cp-red-deep text-white flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-4 right-4">
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>
      <BrandMark size="md" className="mb-4 items-center" />
      <h1 className="text-3xl md:text-5xl font-black mb-2 text-center text-white">
        {t.meatCounterTitle}
      </h1>
      <p className="text-cp-yellow/90 text-xl md:text-2xl mb-10 text-center">
        {t.enterNamePrompt}
      </p>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl flex flex-col gap-6"
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(filterNameInput(e.target.value))}
          placeholder={t.firstNamePlaceholder}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          className="w-full rounded-3xl bg-cp-red-dark border-4 border-cp-yellow/60 focus:border-cp-yellow px-8 py-8 text-4xl md:text-6xl font-bold text-center placeholder:text-white/40 text-white"
        />

        <div className="flex flex-col gap-3">
          <label className="text-cp-yellow/90 text-lg font-semibold text-center">
            {t.phoneOptionalLabel}
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^\d+\-().\s]/g, "").slice(0, 20));
              if (!e.target.value.trim()) setSmsConsent(false);
            }}
            placeholder={t.phonePlaceholder}
            autoComplete="tel"
            className="w-full rounded-3xl bg-cp-red-dark border-4 border-cp-yellow/40 focus:border-cp-yellow px-8 py-5 text-2xl md:text-3xl font-bold text-center placeholder:text-white/40 text-white"
          />
        </div>

        {phoneEntered && (
          <label className="flex items-start gap-4 rounded-2xl bg-black/25 border border-cp-yellow/40 px-5 py-4 cursor-pointer">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              required
              className="mt-1 h-6 w-6 accent-cp-yellow shrink-0"
            />
            <span className="text-base md:text-lg leading-snug text-white/95">
              {t.smsConsentLabel}
            </span>
          </label>
        )}

        {error && (
          <p className="text-cp-yellow text-center text-xl font-semibold">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !name.trim() || (phoneEntered && !smsConsent)}
          className="rounded-3xl bg-cp-yellow hover:bg-cp-yellow-deep disabled:opacity-40 disabled:cursor-not-allowed text-cp-red-deep px-8 py-8 text-3xl md:text-5xl font-black shadow-xl"
        >
          {busy ? t.gettingNumber : t.getNumber}
        </button>
      </form>
      <p className="mt-8 text-cp-yellow/60 text-sm">{t.lettersOnlyHint}</p>
    </main>
  );
}
