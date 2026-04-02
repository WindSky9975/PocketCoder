"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  localeMessages,
  type Locale,
  type Messages,
} from "./messages.ts";
import { getNextLocale, normalizeLocale } from "./helpers.ts";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let nextLocale = DEFAULT_LOCALE;

    try {
      nextLocale = normalizeLocale(globalThis.localStorage.getItem(LOCALE_STORAGE_KEY));
    } catch {
      nextLocale = DEFAULT_LOCALE;
    }

    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    document.documentElement.lang = locale;

    try {
      globalThis.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Ignore localStorage failures and keep the in-memory selection.
    }
  }, [locale, storageReady]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        messages: localeMessages[locale],
        setLocale(localeValue) {
          setLocaleState(localeValue);
        },
        toggleLocale() {
          setLocaleState((current) => getNextLocale(current));
        },
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}

export function useMessages(): Messages {
  return useLocale().messages;
}
