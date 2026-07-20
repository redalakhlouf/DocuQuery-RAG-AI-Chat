"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import fr from "../../locales/fr.json";
import en from "../../locales/en.json";

const translations = { fr, en };
const LanguageContext = createContext({
  lang: "fr",
  t: (key) => key,
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dq-lang");
    if (saved === "fr" || saved === "en") {
      setLang(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang;
    localStorage.setItem("dq-lang", lang);
  }, [lang, mounted]);

  const toggleLanguage = () => setLang((l) => (l === "fr" ? "en" : "fr"));

  const t = useCallback(
    (key) => {
      const keys = key.split(".");
      let value = translations[lang];
      for (const k of keys) {
        value = value?.[k];
      }
      return typeof value === "string" ? value : key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
