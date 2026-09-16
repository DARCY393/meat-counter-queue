"use client";

import { useCallback, useEffect, useState } from "react";

export type Lang = "en" | "es";

export const LANG_STORAGE_KEY = "mcp-lang";
export const DEFAULT_LANG: Lang = "es";

const dictionaries = {
  en: {
    storeName: "Cost+Plus",
    supermarket: "SUPERMARKET",
    meatCounter: "Meat Counter",
    meatCounterTitle: "Cost+Plus Meat Counter",
    enterNamePrompt: "Enter your name to get a number",
    enterYourName: "Enter your name",
    firstNamePlaceholder: "First name",
    getNumber: "Get number",
    gettingNumber: "Getting number…",
    yourNumber: "Your number",
    pleaseWatchBoard: "Please watch the board for your turn",
    nextCustomer: "Next customer",
    lettersOnlyHint: "Letters and spaces only",
    pleaseEnterName: "Please enter your name",
    couldNotGetNumber: "Could not get a number",
    networkError: "Network error — try again",
    networkErrorShort: "Network error",
    nowServing: "Now Serving",
    upNext: "Up Next",
    noOneWaiting: "No one waiting",
    waiting: "Waiting",
    live: "LIVE",
    reconnecting: "RECONNECTING…",
    counter: "Counter",
    staffControl: "Staff control",
    liveLower: "live",
    offline: "offline",
    resetDay: "Reset day",
    resetConfirm:
      "Reset the day? This clears all tickets and starts numbering at 1 again.",
    next: "NEXT",
    skip: "Skip",
    recall: "Recall",
    recallLast: "Recall last",
    none: "None",
    fullQueue: "Full queue",
    queueEmpty: "Queue empty — send customers to the kiosk",
    actionFailed: "Action failed",
    statusWaiting: "Waiting",
    statusServing: "Serving",
    statusDone: "Done",
    statusSkipped: "Skipped",
    homeEyebrow: "Cost+Plus Meat Counter",
    homeTitle: "Walk-up ticketing",
    homeBlurb:
      "Open each view in its own browser window on the local network. No accounts — designed for an on-site PC behind the counter.",
    linkKiosk: "Kiosk",
    linkKioskDesc: "Customer walk-up: enter name, get a ticket number",
    linkBoard: "Customer Board",
    linkBoardDesc: "TV signage: NOW SERVING + UP NEXT (live SSE)",
    linkCounter: "Counter",
    linkCounterDesc: "Staff view with huge NEXT button",
    mvpSwitchNote:
      "MVP stand-in for physical IP67 switch (future GPIO / USB HID)",
  },
  es: {
    storeName: "Cost+Plus",
    supermarket: "SUPERMARKET",
    meatCounter: "Carnicería",
    meatCounterTitle: "Carnicería Cost+Plus",
    enterNamePrompt: "Escriba su nombre para obtener un número",
    enterYourName: "Escriba su nombre",
    firstNamePlaceholder: "Nombre",
    getNumber: "Obtener número",
    gettingNumber: "Obteniendo número…",
    yourNumber: "Su número",
    pleaseWatchBoard: "Por favor mire la pantalla para su turno",
    nextCustomer: "Siguiente cliente",
    lettersOnlyHint: "Solo letras y espacios",
    pleaseEnterName: "Por favor escriba su nombre",
    couldNotGetNumber: "No se pudo obtener un número",
    networkError: "Error de red — intente de nuevo",
    networkErrorShort: "Error de red",
    nowServing: "Ahora sirviendo",
    upNext: "Siguientes",
    noOneWaiting: "Nadie en espera",
    waiting: "En espera",
    live: "EN VIVO",
    reconnecting: "RECONECTANDO…",
    counter: "Mostrador",
    staffControl: "Control del personal",
    liveLower: "en vivo",
    offline: "sin conexión",
    resetDay: "Reiniciar día",
    resetConfirm:
      "¿Reiniciar ahora? Los turnos también se borran solos a medianoche. Esto borra todo y empieza en 1.",
    next: "SIGUIENTE",
    skip: "Saltar",
    recall: "Llamar de nuevo",
    recallLast: "Llamar de nuevo",
    none: "Ninguno",
    fullQueue: "Cola completa",
    queueEmpty: "Cola vacía — envíe a los clientes al kiosco",
    actionFailed: "Acción fallida",
    statusWaiting: "En espera",
    statusServing: "Sirviendo",
    statusDone: "Listo",
    statusSkipped: "Saltado",
    homeEyebrow: "Carnicería Cost+Plus",
    homeTitle: "Sistema de turnos",
    homeBlurb:
      "Abra cada vista en su propia ventana del navegador en la red local. Sin cuentas — diseñado para una PC en el mostrador.",
    linkKiosk: "Kiosco",
    linkKioskDesc: "Clientes: escriba su nombre y obtenga un número",
    linkBoard: "Pantalla",
    linkBoardDesc: "TV: AHORA SIRVIENDO + SIGUIENTES (SSE en vivo)",
    linkCounter: "Mostrador",
    linkCounterDesc: "Vista del personal con el botón SIGUIENTE",
    mvpSwitchNote:
      "Sustituto MVP del interruptor físico IP67 (futuro GPIO / USB HID)",
  },
} as const;

type RawDict = (typeof dictionaries)["en"];
export type MessageKey = keyof RawDict;
export type Dict = Record<MessageKey, string>;

export function getDictionary(lang: Lang): Dict {
  return dictionaries[lang] ?? dictionaries.es;
}

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "es";
}

export function readStoredLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(raw)) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_LANG;
}

export function writeStoredLang(lang: Lang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

/** Allowed name characters: Latin letters + Spanish accents/ñ + spaces */
export const NAME_CHAR_RE = /[^A-Za-záéíóúüñÁÉÍÓÚÜÑ ]/g;
export const NAME_VALID_RE = /^[A-Za-záéíóúüñÁÉÍÓÚÜÑ ]+$/;

export function filterNameInput(value: string): string {
  return value.replace(NAME_CHAR_RE, "").slice(0, 40);
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLangState(readStoredLang());
    setReady(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeStoredLang(next);
  }, []);

  const t = getDictionary(lang);

  return { lang, setLang, t, ready };
}
