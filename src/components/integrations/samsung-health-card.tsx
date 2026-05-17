"use client";

import { useEffect, useState } from "react";
import { AppShortcutLink } from "@/src/components/integrations/app-shortcut-link";
import { samsungHealthIntegration } from "@/src/lib/integrations";

type StatusResponse = {
  ok: boolean;
  configured: boolean;
  lastSyncMetricAt: string | null;
  autoSyncEnabled?: boolean;
};

export function SamsungHealthCard() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [lastSyncMetricAt, setLastSyncMetricAt] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/health/samsung/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as StatusResponse;
        if (!mounted) return;
        setConfigured(Boolean(data.configured));
        setLastSyncMetricAt(data.lastSyncMetricAt ?? null);
        setAutoSyncEnabled(Boolean(data.autoSyncEnabled));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onToggleAutoSync() {
    const next = !autoSyncEnabled;
    setSaving(true);
    try {
      const res = await fetch("/api/health/samsung/preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ autoSyncEnabled: next }),
      });
      if (!res.ok) return;
      setAutoSyncEnabled(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">Samsung Health</h2>
      <p className="muted">
        Connecte Samsung Health pour comparer tes tendances (activite, cardio, sommeil) avec tes performances FitAI.
      </p>
      <div className="chips">
        <span className="chip">Statut: {configured ? "Configure" : "Non configure"}</span>
        <span className="chip">
          Sync auto: {loading ? "..." : autoSyncEnabled ? "Active" : "Inactive"}
        </span>
        <span className="chip">Derniere sync: {lastSyncMetricAt ? new Date(lastSyncMetricAt).toLocaleString("fr-FR") : "Jamais"}</span>
      </div>
      <div className="grid-2" style={{ marginTop: 10 }}>
        <button className="ghost-btn" type="button" onClick={onToggleAutoSync} disabled={saving || loading}>
          {saving ? "..." : autoSyncEnabled ? "Desactiver sync auto" : "Activer sync auto"}
        </button>
        <AppShortcutLink
          label={`Ouvrir ${samsungHealthIntegration.appName}`}
          deepLinkUrl={samsungHealthIntegration.deepLinkUrl}
          fallbackWebUrl={samsungHealthIntegration.fallbackWebUrl}
          className="ghost-btn"
        />
      </div>
    </section>
  );
}

