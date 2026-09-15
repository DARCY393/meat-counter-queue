"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLang } from "@/lib/i18n";

export default function Home() {
  const { lang, setLang, t } = useLang();

  const links = [
    {
      href: "/kiosk",
      title: t.linkKiosk,
      desc: t.linkKioskDesc,
      color: "from-cp-yellow to-cp-yellow-deep text-cp-red-deep",
    },
    {
      href: "/board",
      title: t.linkBoard,
      desc: t.linkBoardDesc,
      color: "from-cp-red to-cp-red-deep text-white",
    },
    {
      href: "/counter",
      title: t.linkCounter,
      desc: t.linkCounterDesc,
      color: "from-cp-red-deep to-cp-red-dark text-white",
    },
  ];

  return (
    <main className="min-h-screen bg-cp-red-dark text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <BrandMark size="lg" />
          <LanguageToggle lang={lang} onChange={setLang} />
        </div>
        <p className="text-cp-yellow font-semibold tracking-widest uppercase text-sm mb-3">
          {t.homeEyebrow}
        </p>
        <h1 className="text-4xl md:text-5xl font-black mb-4">{t.homeTitle}</h1>
        <p className="text-white/85 text-lg mb-10 max-w-2xl">{t.homeBlurb}</p>
        <div className="grid gap-4 md:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl bg-gradient-to-br ${link.color} p-6 shadow-lg hover:scale-[1.02] transition-transform border-2 border-cp-yellow/40`}
            >
              <h2 className="text-2xl font-bold mb-2">{link.title}</h2>
              <p className="opacity-90 text-sm leading-relaxed">{link.desc}</p>
              <p className="mt-4 font-mono text-sm opacity-80">{link.href}</p>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-cp-yellow/50 text-xs">
          Branding reference: /branding-costplus.png (supplied store asset)
        </p>
      </div>
    </main>
  );
}
