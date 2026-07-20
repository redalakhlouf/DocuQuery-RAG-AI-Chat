"use client";

import { useLanguage } from "@/app/contexts/LanguageContext";

export default function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="h-10 px-3 flex items-center justify-center rounded-lg border border-dq-border hover:border-dq-accent/40 hover:bg-dq-accent/5 transition-all duration-200 cursor-pointer font-mono text-xs font-medium text-dq-text-secondary focus-visible:ring-2 focus-visible:ring-dq-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dq-surface"
      aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
      title={lang === "fr" ? "English" : "Français"}
    >
      {lang === "fr" ? "EN" : "FR"}
    </button>
  );
}
