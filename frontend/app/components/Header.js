"use client";

import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "@/app/contexts/LanguageContext";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const name = localStorage.getItem("display_name");
    if (name) setDisplayName(name);
  }, [user]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  return (
    <header className="header-glass fixed top-0 left-0 right-0 px-4 sm:px-6 py-3 flex items-center justify-between relative z-50">
      <a
        href={user ? "/dashboard" : "/"}
        className="font-display text-lg font-bold text-dq-text tracking-tight no-underline"
      >
        DocuQuery
      </a>

      {/* Desktop nav — logged out */}
      {loaded && !user && (
        <nav className="hidden sm:flex items-center gap-3">
          <a
            href="/login"
            className="text-sm text-dq-text-secondary hover:text-dq-text transition-colors no-underline px-3 py-2"
          >
            {t("nav.login")}
          </a>
          <a
            href="/login"
            className="bg-dq-accent hover:bg-dq-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5 no-underline"
          >
            {t("nav.start")}
          </a>
          <div className="w-px h-5 bg-dq-border mx-1" />
          <ThemeToggle />
          <LanguageToggle />
        </nav>
      )}

      {/* Desktop nav — logged in */}
      {loaded && user && (
        <nav className="hidden sm:flex items-center gap-2">
          <a
            href="/dashboard"
            className="text-sm text-dq-text-secondary hover:text-dq-text transition-colors no-underline px-3 py-2 rounded-lg hover:bg-dq-surface-hover"
          >
            {t("nav.dashboard")}
          </a>
          <a
            href="/upload"
            className="bg-dq-accent hover:bg-dq-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 no-underline"
          >
            {t("nav.new")}
          </a>
          <a
            href="/chat"
            className="text-sm text-dq-text-secondary hover:text-dq-text transition-colors no-underline px-3 py-2 rounded-lg hover:bg-dq-surface-hover"
          >
            {t("nav.chat")}
          </a>
          <div className="w-px h-5 bg-dq-border mx-1" />
          <span className="text-xs text-dq-text-muted font-mono max-w-[140px] truncate">
            {displayName || user.email}
          </span>
          <a
            href="/settings"
            className="text-xs text-dq-text-muted hover:text-dq-text transition-colors no-underline px-2 py-1 focus-visible:ring-2 focus-visible:ring-dq-accent rounded"
          >
            {t("nav.settings")}
          </a>
          <button
            onClick={handleLogout}
            className="text-xs text-dq-text-muted hover:text-dq-error transition-colors bg-transparent border-none cursor-pointer px-2 py-1 focus-visible:ring-2 focus-visible:ring-dq-accent rounded"
          >
            {t("nav.logout")}
          </button>
          <div className="w-px h-5 bg-dq-border mx-1" />
          <ThemeToggle />
          <LanguageToggle />
        </nav>
      )}

      {/* Mobile burger */}
      <div className="sm:hidden flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="flex flex-col gap-1.5 p-2 bg-transparent border-none cursor-pointer focus-visible:ring-2 focus-visible:ring-dq-accent rounded"
          aria-label={menuOpen ? t("header.closeMenu") : t("header.openMenu")}
          aria-expanded={menuOpen}
        >
          <span
            className={`block w-5 h-0.5 bg-dq-text transition-transform duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-dq-text transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-dq-text transition-transform duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="absolute top-full left-0 right-0 bg-dq-surface border-b border-dq-border px-4 py-4 sm:hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {!user ? (
            <div className="flex flex-col gap-3">
              <a
                href="/login"
                className="text-dq-text py-2 text-sm font-medium hover:text-dq-accent transition-colors no-underline"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.login")}
              </a>
              <a
                href="/login"
                className="bg-dq-accent text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-dq-accent-hover transition-colors text-center no-underline"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.start")}
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <a
                href="/dashboard"
                className="text-dq-text py-2 text-sm font-medium hover:text-dq-accent transition-colors no-underline"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.dashboard")}
              </a>
              <a
                href="/upload"
                className="bg-dq-accent text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-dq-accent-hover transition-colors text-center no-underline"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.upload")}
              </a>
              <a
                href="/chat"
                className="text-dq-text py-2 text-sm font-medium hover:text-dq-accent transition-colors no-underline"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.chat")}
              </a>
              <a
                href="/settings"
                className="text-dq-text py-2 text-sm font-medium hover:text-dq-accent transition-colors no-underline"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.settings")}
              </a>
              <span className="text-xs text-dq-text-muted font-mono pt-2 border-t border-dq-border">
                {displayName || user.email}
              </span>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="text-sm text-dq-error hover:text-dq-error/80 transition-colors text-left bg-transparent border-none cursor-pointer focus-visible:ring-2 focus-visible:ring-dq-accent rounded"
              >
                {t("nav.logout")}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
