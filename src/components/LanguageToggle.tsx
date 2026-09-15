"use client";

import type { Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
};

export function LanguageToggle({ lang, onChange, className = "" }: Props) {
  return (
    <div
      className={`inline-flex rounded-full border-2 border-cp-yellow/80 bg-black/30 p-1 text-sm font-black tracking-wide ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-full px-3 py-1 transition-colors ${
          lang === "en"
            ? "bg-cp-yellow text-cp-red"
            : "text-cp-yellow/80 hover:text-cp-yellow"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange("es")}
        className={`rounded-full px-3 py-1 transition-colors ${
          lang === "es"
            ? "bg-cp-yellow text-cp-red"
            : "text-cp-yellow/80 hover:text-cp-yellow"
        }`}
      >
        ES
      </button>
    </div>
  );
}
