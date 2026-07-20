"use client";

import { useUser } from "@/app/hooks/useUser";
import { apiGet } from "@/app/utils/api";
import Badge from "@/app/components/Badge";
import Skeleton from "@/app/components/Skeleton";
import EmptyState from "@/app/components/EmptyState";
import SetupNameModal from "@/app/components/SetupNameModal";
import { useError } from "@/app/contexts/ErrorContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useEffect, useState, useRef } from "react";

const BORDER_COLOR = {
  ready: "border-l-dq-success",
  error: "border-l-dq-error",
  processing: "border-l-dq-accent",
  pending: "border-l-dq-accent",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getAvatarColor(name) {
  const colors = [
    "avatar-red", "avatar-blue", "avatar-green",
    "avatar-purple", "avatar-pink", "avatar-orange",
    "avatar-teal", "avatar-yellow",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitial(name) {
  if (!name || name.trim().length === 0) return "?";
  return name.trim()[0].toUpperCase();
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const steps = 20;
    let current = 0;
    const increment = value / steps;
    const interval = setInterval(() => {
      current++;
      const next = Math.min(Math.round(increment * current), value);
      setDisplay(next);
      if (current >= steps || next >= value) {
        clearInterval(interval);
        setDisplay(value);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [value]);

  return <span className="count-up">{display}</span>;
}

function DocCounter({ count }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(count, 20) / 20) * circumference;

  return (
    <div className="relative w-20 h-20 mx-auto">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--dq-border)"
          strokeWidth="4"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--dq-accent)"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-dq-text">
        {count}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useUser("/login");
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [displayName, setDisplayName] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const { addToast } = useError();
  const { t } = useLanguage();

  useEffect(() => {
    if (!user) return;

    apiGet("/api/v1/documents")
      .then((data) => setDocuments(data.documents || []))
      .catch(() => addToast(t("dashboard.loadingError"), "error"))
      .finally(() => setLoadingDocs(false));
  }, [user, addToast, t]);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem("display_name") || "";
    if (saved) {
      setDisplayName(saved);
      setSetupDone(true);
    } else {
      const shown = sessionStorage.getItem("setup-shown");
      if (!shown) {
        setShowSetup(true);
        sessionStorage.setItem("setup-shown", "true");
      }
    }
  }, [user]);

  if (loading) return null;

  const totalCount = documents.length;
  const display = displayName || user?.email;
  const greeting = getGreeting();
  const initial = getInitial(display);
  const colorClass = getAvatarColor(display);

  return (
    <>
      <SetupNameModal
        user={user}
        open={showSetup}
        onComplete={(name) => { setDisplayName(name); setShowSetup(false); setSetupDone(true); }}
        onSkip={() => { setShowSetup(false); }}
      />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 pt-20">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 space-y-4">
            {/* Welcome card */}
            <div className="bg-dq-surface/80 backdrop-blur-sm rounded-xl border border-dq-border p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className={`avatar-base w-12 h-12 text-lg ${colorClass}`}>
                  {initial}
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold leading-tight">
                    {t("dashboard.welcomeGreeting")}, {display}
                  </h1>
                  <p className="text-xs text-dq-text-muted font-mono">
                    {new Date().toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-dq-surface/80 backdrop-blur-sm rounded-xl border border-dq-border p-5 space-y-3">
              <a
                href="/upload"
                className="flex items-center gap-3 p-3 rounded-lg bg-dq-accent/10 border border-dq-accent/20 hover:bg-dq-accent/20 transition-all no-underline group"
              >
                <span className="text-dq-accent text-lg font-bold leading-none">
                  +
                </span>
                <div>
                  <p className="text-sm font-medium text-dq-text">{t("dashboard.newDoc")}</p>
                  <p className="text-xs text-dq-text-muted">{t("dashboard.newDocDesc")}</p>
                </div>
              </a>

              <a
                href="/chat"
                className="flex items-center gap-3 p-3 rounded-lg border border-dq-border hover:border-dq-accent/30 hover:bg-dq-surface-hover transition-all no-underline"
              >
                <span className="text-dq-accent font-mono text-sm font-medium leading-none">
                  &gt;_
                </span>
                <div>
                  <p className="text-sm font-medium text-dq-text">{t("dashboard.askQuestion")}</p>
                  <p className="text-xs text-dq-text-muted">{t("dashboard.askQuestionDesc")}</p>
                </div>
              </a>

              <a
                href="/settings"
                className="flex items-center gap-3 p-3 rounded-lg border border-dq-border hover:border-dq-accent/30 hover:bg-dq-surface-hover transition-all no-underline"
              >
                <span className="text-dq-accent text-lg font-bold leading-none">
                  &#9881;
                </span>
                <div>
                  <p className="text-sm font-medium text-dq-text">{t("nav.settings")}</p>
                  <p className="text-xs text-dq-text-muted">Modifier ton profil</p>
                </div>
              </a>
            </div>

            {/* Counter */}
            <div className="bg-dq-surface/80 backdrop-blur-sm rounded-xl border border-dq-border p-5 text-center">
              <DocCounter count={totalCount} />
              <p className="text-xs text-dq-text-muted font-mono mt-3">
                <AnimatedNumber value={totalCount} /> document{totalCount !== 1 ? "s" : ""} indexé{totalCount !== 1 ? "s" : ""}
              </p>
            </div>
          </aside>

          {/* Main: document list */}
          <section className="flex-1 min-w-0">
            <div className="bg-dq-surface/80 backdrop-blur-sm rounded-xl border border-dq-border p-6">
              <h2 className="font-display text-xl font-bold mb-5">{t("dashboard.myDocuments")}</h2>

              {loadingDocs ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <EmptyState
                  icon="📂"
                  title={t("dashboard.noDocsTitle")}
                  description={t("dashboard.noDocsDescription")}
                  actionLabel={t("dashboard.noDocsAction")}
                  actionHref="/upload"
                />
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-4 rounded-lg border border-dq-border bg-dq-bg/60 border-l-4 ${
                        BORDER_COLOR[doc.status] || "border-l-dq-text-muted"
                      } hover:border-dq-accent/30 transition-colors`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl flex-shrink-0" aria-hidden="true">
                          📄
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-dq-text">
                            {doc.filename}
                          </p>
                          <p className="text-xs text-dq-text-muted font-mono">
                            {new Date(doc.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge status={doc.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
