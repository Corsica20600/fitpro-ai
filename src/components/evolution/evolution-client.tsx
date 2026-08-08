"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { ProgressChart } from "@/src/components/progress/progress-chart";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { StatBadge } from "@/src/components/ui/stat-badge";
import {
  BODY_MEASUREMENT_FIELDS,
  type BodyMeasurementField,
  type BodyMeasurementInput,
  type EvolutionOverview,
  type ProgressPhotoItem,
  type ProgressPhotoView,
} from "@/src/types/body-evolution";

type EvolutionClientProps = {
  initialOverview: EvolutionOverview;
  avatarUrl?: string | null;
};

const FIELD_GROUPS: Array<{ title: string; fields: Array<{ key: BodyMeasurementField; label: string; suffix: string }> }> = [
  {
    title: "Repères principaux",
    fields: [
      { key: "weightKg", label: "Poids", suffix: "kg" },
      { key: "bodyFatPercentage", label: "Masse grasse", suffix: "%" },
      { key: "waistCm", label: "Tour de taille", suffix: "cm" },
      { key: "chestCm", label: "Poitrine", suffix: "cm" },
      { key: "hipsCm", label: "Hanches", suffix: "cm" },
    ],
  },
  {
    title: "Bras et jambes",
    fields: [
      { key: "leftArmCm", label: "Bras gauche", suffix: "cm" },
      { key: "rightArmCm", label: "Bras droit", suffix: "cm" },
      { key: "leftThighCm", label: "Cuisse gauche", suffix: "cm" },
      { key: "rightThighCm", label: "Cuisse droite", suffix: "cm" },
      { key: "leftCalfCm", label: "Mollet gauche", suffix: "cm" },
      { key: "rightCalfCm", label: "Mollet droit", suffix: "cm" },
    ],
  },
];

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${unit}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function parseOptionalNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

const PHOTO_VIEWS: Array<{ value: ProgressPhotoView; label: string }> = [
  { value: "FRONT", label: "Face" },
  { value: "SIDE", label: "Profil" },
  { value: "BACK", label: "Dos" },
  { value: "FREE", label: "Libre" },
];
const MAX_SOURCE_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_SERVER_PHOTO_BYTES = 4 * 1024 * 1024;

function getPhotoViewLabel(view: ProgressPhotoView) {
  return PHOTO_VIEWS.find((item) => item.value === view)?.label ?? "Libre";
}

async function preparePhotoForPrivateUpload(source: File) {
  const sourceUrl = URL.createObjectURL(source);
  try {
    const image = new window.Image();
    image.src = sourceUrl;
    await image.decode();

    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("photo_prepare_failed");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.86, 0.76, 0.66, 0.56]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= MAX_SERVER_PHOTO_BYTES) {
        return new File([blob], "progress-photo.webp", { type: "image/webp" });
      }
    }
    throw new Error("photo_too_large_after_prepare");
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function EvolutionClient({ initialOverview, avatarUrl }: EvolutionClientProps) {
  const [overview, setOverview] = useState(initialOverview);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(initialOverview.measurements.length === 0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoView, setPhotoView] = useState<ProgressPhotoView>("FRONT");
  const [photoDate, setPhotoDate] = useState(todayInputValue());
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  useEffect(() => () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  }, [photoPreviewUrl]);

  const latestMeasurement = overview.measurements[0] ?? null;
  const latestDetails = useMemo(
    () => latestMeasurement
      ? BODY_MEASUREMENT_FIELDS.flatMap((field) => latestMeasurement[field] == null ? [] : [{ field, value: latestMeasurement[field] }])
      : [],
    [latestMeasurement],
  );

  async function refreshOverview() {
    const response = await fetch("/api/evolution/measurements", { cache: "no-store" });
    const payload = await response.json().catch(() => null) as { overview?: EvolutionOverview } | null;
    if (!response.ok || !payload?.overview) throw new Error("refresh_failed");
    setOverview(payload.overview);
  }

  async function submitMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const formData = new FormData(event.currentTarget);
    const input: BodyMeasurementInput = {
      recordedAt: String(formData.get("recordedAt") ?? ""),
      heightCm: parseOptionalNumber(formData, "heightCm"),
    };
    for (const field of BODY_MEASUREMENT_FIELDS) input[field] = parseOptionalNumber(formData, field);

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/evolution/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("save_failed");
      await refreshOverview();
      event.currentTarget.reset();
      setFormOpen(false);
    } catch {
      setError("Le relevé n'a pas pu être enregistré. Vérifie les valeurs et réessaie.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeMeasurement(measurementId: string) {
    if (deletingId) return;
    setDeletingId(measurementId);
    setError(null);
    try {
      const response = await fetch(`/api/evolution/measurements/${encodeURIComponent(measurementId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete_failed");
      await refreshOverview();
    } catch {
      setError("Le relevé n'a pas pu être supprimé. Réessaie plus tard.");
    } finally {
      setDeletingId(null);
    }
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
    setPhotoFile(null);
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX_SOURCE_PHOTO_BYTES) {
      setError("Choisis une image JPEG, PNG ou WebP de 8 Mo maximum.");
      event.target.value = "";
      return;
    }

    setError(null);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photoFile || isUploadingPhoto) return;

    setIsUploadingPhoto(true);
    setError(null);
    try {
      const uploadFile = await preparePhotoForPrivateUpload(photoFile);
      const formData = new FormData();
      formData.set("file", uploadFile);
      formData.set("recordedAt", photoDate);
      formData.set("view", photoView);
      const response = await fetch("/api/evolution/photos", { method: "POST", body: formData });
      if (!response.ok) throw new Error("photo_upload_failed");
      await refreshOverview();
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
      setPhotoFile(null);
      event.currentTarget.reset();
    } catch {
      setError("La photo n'a pas pu être préparée ou ajoutée. Vérifie le fichier puis réessaie.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function removePhoto(photo: ProgressPhotoItem) {
    if (deletingPhotoId || !window.confirm("Supprimer cette photo de progression ?")) return;
    setDeletingPhotoId(photo.id);
    setError(null);
    try {
      const response = await fetch(`/api/evolution/photos/${encodeURIComponent(photo.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("photo_delete_failed");
      await refreshOverview();
    } catch {
      setError("La photo n'a pas pu être supprimée. Réessaie plus tard.");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  return (
    <div className="stack evolution-page">
      <GlassCard className="evolution-profile-card" elevated>
        <div className="evolution-avatar" aria-hidden="true">
          {avatarUrl ? <Image src={avatarUrl} alt="" width={52} height={52} unoptimized /> : overview.profile.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="fit-section-title__eyebrow">Fiche personnelle</p>
          <h2>{overview.profile.displayName}</h2>
          <p className="muted">Tes relevés restent privés et sont enregistrés uniquement quand tu les ajoutes.</p>
        </div>
        <div className="evolution-profile-stats">
          <span><b>{overview.currentWeightKg != null ? formatValue(overview.currentWeightKg, "kg") : "-"}</b> poids actuel</span>
          <span><b>{overview.profile.heightCm != null ? `${overview.profile.heightCm} cm` : "-"}</b> taille</span>
        </div>
      </GlassCard>

      {overview.deltas.length > 0 ? (
        <GlassCard className="evolution-delta-card">
          <p className="fit-section-title__eyebrow">Depuis ton premier relevé</p>
          <div className="evolution-delta-grid">
            {overview.deltas.slice(0, 4).map((delta) => (
              <span key={delta.field}>
                <small>{delta.label}</small>
                <b>{formatValue(delta.first, delta.unit)} → {formatValue(delta.latest, delta.unit)}</b>
                <em className={delta.difference < 0 ? "success" : delta.difference > 0 ? "accent" : ""}>
                  {delta.difference > 0 ? "+" : ""}{formatValue(delta.difference, delta.unit)}
                </em>
              </span>
            ))}
          </div>
        </GlassCard>
      ) : null}

      {overview.weightSeries.length > 0 ? (
        <ProgressChart
          title="Évolution du poids"
          description="Uniquement à partir de tes relevés confirmés. Les valeurs de profil historiques ne sont pas utilisées."
          bars={overview.weightSeries}
          valueFormatter={(value) => formatValue(value, "kg")}
          bestLabel={overview.currentWeightKg != null ? `Dernier relevé · ${formatValue(overview.currentWeightKg, "kg")}` : null}
        />
      ) : null}

      <GlassCard className="evolution-measurement-card">
        <div className="evolution-section-head">
          <div>
            <p className="fit-section-title__eyebrow">Mensurations</p>
            <h2>Mes relevés</h2>
          </div>
          <button type="button" className="ghost-btn" onClick={() => setFormOpen((open) => !open)}>
            {formOpen ? "Fermer" : "Ajouter"}
          </button>
        </div>

        {formOpen ? (
          <form className="evolution-form" onSubmit={submitMeasurement}>
            <div className="form-grid evolution-form-top">
              <label><span className="field-label">Date du relevé</span><input className="input" name="recordedAt" type="date" defaultValue={todayInputValue()} required /></label>
              <label><span className="field-label">Taille (cm)</span><input className="input" name="heightCm" type="number" min="80" max="250" step="1" defaultValue={overview.profile.heightCm ?? ""} /></label>
            </div>
            {FIELD_GROUPS.map((group) => (
              <fieldset key={group.title} className="evolution-fieldset">
                <legend>{group.title}</legend>
                <div className="evolution-input-grid">
                  {group.fields.map((field) => (
                    <label key={field.key}>
                      <span className="field-label">{field.label} ({field.suffix})</span>
                      <input className="input" name={field.key} type="number" min="0" step="0.1" inputMode="decimal" />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <PrimaryButton type="submit" disabled={isSaving}>{isSaving ? "Enregistrement..." : "Enregistrer le relevé"}</PrimaryButton>
          </form>
        ) : null}

        {error ? <p className="settings-danger-error">{error}</p> : null}

        {latestDetails.length === 0 ? (
          <p className="muted">Ajoute un premier relevé pour suivre ton évolution dans le temps.</p>
        ) : (
          <div className="evolution-latest-grid">
            {latestDetails.slice(0, 6).map(({ field, value }) => {
              const detail = FIELD_GROUPS.flatMap((group) => group.fields).find((item) => item.key === field);
              return detail ? <span key={field}><small>{detail.label}</small><b>{formatValue(value, detail.suffix)}</b></span> : null;
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard className="evolution-gallery-card">
        <div className="evolution-gallery-heading">
          <p className="fit-section-title__eyebrow">Photos de progression</p>
          <h2>Galerie privée</h2>
          <p className="muted">{overview.galleryCount > 0 ? `${overview.galleryCount} photo${overview.galleryCount > 1 ? "s" : ""} enregistrée${overview.galleryCount > 1 ? "s" : ""}.` : "Ajoute des vues face, profil, dos ou libres. Elles restent accessibles uniquement depuis ton compte."}</p>
        </div>
        <StatBadge tone="violet">Privée</StatBadge>

        <form className="evolution-photo-form" onSubmit={uploadPhoto}>
          <label className="evolution-photo-picker">
            <span className="field-label">Photo JPEG, PNG ou WebP · 8 Mo max.</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} required />
          </label>
          <div className="form-grid evolution-photo-controls">
            <label>
              <span className="field-label">Orientation</span>
              <select className="input" value={photoView} onChange={(event) => setPhotoView(event.target.value as ProgressPhotoView)}>
                {PHOTO_VIEWS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">Date</span>
              <input className="input" type="date" value={photoDate} onChange={(event) => setPhotoDate(event.target.value)} required />
            </label>
          </div>
          {photoPreviewUrl ? (
            // The local object URL is not compatible with next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="evolution-photo-preview" src={photoPreviewUrl} alt="Aperçu avant ajout" />
          ) : null}
          <PrimaryButton type="submit" disabled={!photoFile || isUploadingPhoto}>{isUploadingPhoto ? "Optimisation et ajout..." : "Ajouter la photo"}</PrimaryButton>
        </form>

        {overview.photos.length > 0 ? (
          <div className="evolution-photo-grid">
            {overview.photos.map((photo) => (
              <article key={photo.id} className="evolution-photo-item">
                {/* This authenticated route must receive the browser session; next/image cannot forward it. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.imageUrl} alt={`Photo ${getPhotoViewLabel(photo.view).toLowerCase()} du ${formatDate(photo.recordedAt)}`} />
                <div>
                  <span>{getPhotoViewLabel(photo.view)} · {formatDate(photo.recordedAt)}</span>
                  <button type="button" className="ghost-btn danger" disabled={deletingPhotoId === photo.id} onClick={() => void removePhoto(photo)}>
                    {deletingPhotoId === photo.id ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </GlassCard>

      {overview.measurements.length > 0 ? (
        <GlassCard className="evolution-history-card">
          <p className="fit-section-title__eyebrow">Historique</p>
          <h2>Derniers relevés</h2>
          <div className="evolution-history-list">
            {overview.measurements.map((measurement) => (
              <article key={measurement.id}>
                <div>
                  <strong>{formatDate(measurement.recordedAt)}</strong>
                  <p>{BODY_MEASUREMENT_FIELDS.flatMap((field) => {
                    const value = measurement[field];
                    const detail = FIELD_GROUPS.flatMap((group) => group.fields).find((item) => item.key === field);
                    return value != null && detail ? [`${detail.label}: ${formatValue(value, detail.suffix)}`] : [];
                  }).slice(0, 3).join(" · ")}</p>
                </div>
                <button type="button" className="ghost-btn danger" disabled={deletingId === measurement.id} onClick={() => void removeMeasurement(measurement.id)}>
                  {deletingId === measurement.id ? "Suppression..." : "Supprimer"}
                </button>
              </article>
            ))}
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
