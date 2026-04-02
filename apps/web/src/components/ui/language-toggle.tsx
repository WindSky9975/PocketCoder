"use client";

import { useLocale } from "../../lib/i18n/provider.tsx";
import { SUPPORTED_LOCALES } from "../../lib/i18n/messages.ts";

export function LanguageToggle() {
  const { locale, messages, setLocale } = useLocale();

  return (
    <div className="language-toggle">
      <span className="language-toggle__label">{messages.common.languageLabel}</span>
      <div
        className="language-toggle__buttons"
        role="group"
        aria-label={messages.common.languageLabel}
      >
        {SUPPORTED_LOCALES.map((option) => {
          const isActive = option === locale;

          return (
            <button
              key={option}
              type="button"
              className={`language-toggle__button${isActive ? " language-toggle__button--active" : ""}`}
              aria-pressed={isActive}
              onClick={() => setLocale(option)}
            >
              {messages.common.localeNames[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
