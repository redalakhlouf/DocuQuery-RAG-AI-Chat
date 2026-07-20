"use client";

import { createClient } from "@/app/utils/supabase/client";
import { useState, useEffect } from "react";
import SemanticWords from "@/app/components/SemanticWords";
import ThemeToggle from "@/app/components/ThemeToggle";
import LanguageToggle from "@/app/components/LanguageToggle";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { boostGrid } from "@/app/components/GridBackground";
function IconGoogle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    boostGrid(0.5, 800);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setError(t("login.accountCreated"));
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = "/dashboard";
      }
    }
  };

  const handleGoogleLogin = async () => {
    boostGrid(0.5, 800);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) setError(error.message);
  };

  return (
    <div className="grain-overlay relative flex flex-col md:flex-row min-h-screen">
      {/* ── Left panel: brand statement ── */}
      <div className="relative flex flex-col justify-center items-start px-8 sm:px-12 md:px-16 lg:px-20 py-12 md:py-0 md:w-[55%] h-[35vh] md:h-screen overflow-hidden bg-dq-bg-deep">
        {/* Accent line */}
        <div
          className="hidden md:block absolute right-0 top-[12%] bottom-[12%] w-[2px]"
          style={{
            background: `linear-gradient(to bottom, transparent, var(--dq-accent), transparent)`,
          }}
        />

        {/* Semantic words — very subtle on login */}
        <div className="absolute inset-0 opacity-30">
          <SemanticWords color="var(--dq-accent)" />
        </div>

        {/* Brand content */}
        <div
          className={`relative z-10 transition-all duration-700 ease-out ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.05] tracking-tight mb-5 text-dq-text whitespace-pre-line">
            {t("login.brandStatement")}
          </h1>
          <p className="text-dq-text-secondary text-sm sm:text-base leading-relaxed max-w-md">
            {t("login.brandSubtitle")}
          </p>
        </div>
      </div>

      {/* ── Right panel: form + toggles ── */}
      <div className="relative flex flex-col justify-center items-center px-6 py-12 md:py-0 md:w-[45%] md:h-screen overflow-y-auto bg-dq-bg">
        {/* Toggles — top right on desktop, inline on mobile */}
        <div className="hidden md:flex absolute top-5 right-6 gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        <div className="w-full max-w-sm">
          {/* Logo */}
          <div
            className={`mb-10 transition-all duration-700 delay-100 ease-out ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            <h2 className="font-display text-2xl font-bold text-dq-text tracking-tight">
              DocuQuery
            </h2>
            <p className="text-dq-text-muted text-xs font-mono mt-1">
              {t("login.tagline")}
            </p>
          </div>

          {/* Form card — glass surface */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border border-dq-border bg-dq-surface/60 backdrop-blur-sm transition-all duration-700 delay-200 ease-out ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            <h3 className="font-display text-lg font-semibold mb-6 text-dq-text">
              {isSignUp ? t("login.signup") : t("login.signin")}
            </h3>

            {error && (
              <p
                className="text-sm mb-4 p-3 rounded-lg bg-dq-error/10 text-dq-error border border-dq-error/20"
                role="alert"
              >
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-split-input w-full px-0 py-3 text-sm mb-5"
                required
                autoComplete="email"
                aria-label={t("login.email")}
              />

              <input
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-split-input w-full px-0 py-3 text-sm mb-6"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                aria-label={t("login.password")}
              />

              <button
                type="submit"
                className="w-full py-3 bg-dq-accent text-white rounded-xl hover:bg-dq-accent-hover transition-all duration-200 font-medium text-sm focus-visible:ring-2 focus-visible:ring-dq-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dq-surface hover:shadow-[0_0_24px_-4px] hover:shadow-dq-accent/30"
              >
                {isSignUp ? t("login.signupButton") : t("login.signinButton")}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dq-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-dq-surface px-3 text-dq-text-muted font-mono">
                  {t("common.or")}
                </span>
              </div>
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 border border-dq-border text-dq-text rounded-xl hover:bg-dq-surface-hover transition-all duration-200 flex items-center justify-center gap-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-dq-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dq-surface"
            >
              <IconGoogle className="w-4 h-4" />
              {t("login.googleButton")}
            </button>
          </div>

          {/* Toggle sign-in / sign-up */}
          <p
            className={`text-center text-sm text-dq-text-secondary mt-6 transition-all duration-700 delay-300 ease-out ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            {isSignUp ? t("login.hasAccount") : t("login.noAccount")}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-dq-accent hover:text-dq-accent-hover transition-colors bg-transparent border-none cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-dq-accent rounded"
            >
              {isSignUp ? t("login.signinLink") : t("login.signupLink")}
            </button>
          </p>

          {/* Mobile toggles */}
          <div className="flex md:hidden justify-center gap-2 mt-8">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
