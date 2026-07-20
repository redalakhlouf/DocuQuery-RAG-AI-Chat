"use client";

import { useUser } from "@/app/hooks/useUser";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { useError } from "@/app/contexts/ErrorContext";
import Skeleton from "@/app/components/Skeleton";

export default function SettingsPage() {
  const { user, loading } = useUser("/login");
  const { t } = useLanguage();
  const { addToast } = useError();
  const [displayName, setDisplayName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadedData, setLoadedData] = useState(false);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem("display_name") || "";
    setDisplayName(saved);
    setInitialName(saved);
    setLoadedData(true);
  }, [user]);

  const hasChanged = displayName !== initialName;

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    localStorage.setItem("display_name", displayName.trim());
    addToast(t("settings.saved"), "success");
    setInitialName(displayName.trim());
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-20">
        <div className="bg-dq-surface rounded-xl border border-dq-border p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-20">
      <a
        href="/dashboard"
        className="inline-flex items-center text-sm text-dq-text-secondary hover:text-dq-accent transition-colors mb-4 no-underline"
      >
        &larr; {t("settings.backToDashboard")}
      </a>

      <div className="bg-dq-surface rounded-xl border border-dq-border p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold mb-1">{t("settings.title")}</h1>
        <p className="text-sm text-dq-text-secondary mb-8">{t("settings.profile")}</p>

        {!loadedData ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-dq-text mb-1">
                {t("settings.displayName")}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("settings.displayNamePlaceholder")}
                className="w-full px-4 py-3 rounded-lg bg-dq-bg border border-dq-border text-dq-text placeholder-dq-text-muted focus:outline-none focus:border-dq-accent transition-colors"
              />
              <p className="text-xs text-dq-text-muted mt-1">{t("settings.displayNameHint")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dq-text mb-1">
                {t("settings.email")}
              </label>
              <p className="text-sm text-dq-text-secondary px-4 py-3 rounded-lg bg-dq-bg border border-dq-border">
                {user?.email}
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={!hasChanged || saving}
              className="px-6 py-3 bg-dq-accent text-white rounded-lg hover:bg-dq-accent-hover transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? t("common.saving") || "Saving..." : t("settings.save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
