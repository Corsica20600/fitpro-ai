"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { ProgressChart } from "@/src/components/progress/progress-chart";
import { ProgressPhotoComparison } from "@/src/components/evolution/progress-photo-comparison";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { BrandSelect } from "@/src/components/ui/brand-select";
import { TraknioDatePicker } from "@/src/components/ui/traknio-date-picker";
import { calculateBodyFatPercentage } from "@/src/lib/body-measurements";
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
      { key: "fatMassKg", label: "Masse grasse", suffix: "kg" },
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

const MEASUREMENT_DISPLAY_FIELDS = FIELD_GROUPS.flatMap((group) => group.fields);
const BODY_FAT_PERCENTAGE_FIELD = { key: "bodyFatPercentage" as const, label: "Taux de masse grasse", suffix: "%" };
const LATEST_MEASUREMENT_FIELDS = MEASUREMENT_DISPLAY_FIELDS.flatMap((field) => field.key === "fatMassKg" ? [field, BODY_FAT_PERCENTAGE_FIELD] : [field]);

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
const isProgressPhotoDebug = process.env.NODE_ENV !== "production";

function describePhotoFile(file: File) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "" : "";
  return {
    extension,
    fileNameLength: file.name.length,
    mimeType: file.type || "unknown",
    byteSize: file.size,
  };
}

function logProgressPhotoPipeline(stage: string, details: Record<string, unknown> = {}) {
  if (!isProgressPhotoDebug) return;
  console.info("PROGRESS_PHOTO_PIPELINE", { stage, ...details });
}

function getPhotoErrorCode(error: unknown) {
  return error instanceof Error && error.message ? error.message : "photo_upload_failed";
}

function isSupportedSourcePhotoMimeType(mimeType: string) {
  return !mimeType || ["image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/x-png", "image/webp"].includes(mimeType.toLowerCase());
}

function getPhotoErrorMessage(code: string) {
  if (code === "photo_too_large" || code === "photo_too_large_after_prepare") {
    return "Cette photo reste trop volumineuse après optimisation. Choisis une image de moins de 8 Mo.";
  }
  if (["invalid_photo_type", "INVALID_PHOTO_MIME", "INVALID_PHOTO_SIGNATURE", "photo_image_load_failed"].includes(code)) {
    return "Cette photo n'est pas un JPEG, PNG ou WebP valide. Choisis un autre fichier puis réessaie.";
  }
  if (code.startsWith("photo_prepare")) {
    return "La photo n'a pas pu être préparée sur cet appareil. Réessaie avec une autre image.";
  }
  return "La photo n'a pas pu être ajoutée à ta galerie privée. Réessaie dans un instant.";
}

function loadImageForPhotoPreparation(sourceUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => image.naturalWidth > 0 && image.naturalHeight > 0
      ? resolve(image)
      : reject(new Error("photo_image_load_failed"));
    image.onerror = () => reject(new Error("photo_image_load_failed"));
    image.src = sourceUrl;
  });
}

function getPhotoViewLabel(view: ProgressPhotoView) {
  return PHOTO_VIEWS.find((item) => item.value === view)?.label ?? "Libre";
}

function getMeasurementDetail(field: BodyMeasurementField) {
  return LATEST_MEASUREMENT_FIELDS.find((item) => item.key === field);
}

function measurementSummary(measurement: EvolutionOverview["measurements"][number]) {
  const values = [
    measurement.weightKg != null ? formatValue(measurement.weightKg, "kg") : null,
    measurement.waistCm != null ? `Taille ${formatValue(measurement.waistCm, "cm")}` : null,
    measurement.fatMassKg != null ? `MG ${formatValue(measurement.fatMassKg, "kg")}` : measurement.bodyFatPercentage != null ? `MG ${formatValue(measurement.bodyFatPercentage, "%")}` : null,
  ].filter(Boolean);
  return values.length > 0 ? values.join(" • ") : "Mensurations enregistrées";
}

async function preparePhotoForPrivateUpload(source: File) {
  const sourceUrl = URL.createObjectURL(source);
  try {
    logProgressPhotoPipeline("prepare_started", describePhotoFile(source));
    // `Image.decode()` can reject for content:// files in Android WebView even when onload succeeds.
    // Loading through the image event is supported by browsers and WebView alike.
    const image = await loadImageForPhotoPreparation(sourceUrl);
    logProgressPhotoPipeline("image_loaded", { width: image.naturalWidth, height: image.naturalHeight });

    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("photo_prepare_failed");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    logProgressPhotoPipeline("canvas_ready", { width: canvas.width, height: canvas.height });

    for (const quality of [0.86, 0.76, 0.66, 0.56]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= MAX_SERVER_PHOTO_BYTES) {
        const prepared = new File([blob], "progress-photo.webp", { type: "image/webp" });
        logProgressPhotoPipeline("image_prepared", { mimeType: prepared.type, byteSize: prepared.size, quality });
        return prepared;
      }
    }
    throw new Error("photo_too_large_after_prepare");
  } catch (error) {
    logProgressPhotoPipeline("prepare_failed", { code: getPhotoErrorCode(error) });
    throw error;
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
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedMeasurementId, setExpandedMeasurementId] = useState<string | null>(null);
  const [measurementMenuId, setMeasurementMenuId] = useState<string | null>(null);
  const [draftWeightKg, setDraftWeightKg] = useState("");
  const [draftFatMassKg, setDraftFatMassKg] = useState("");
  const [measurementDate, setMeasurementDate] = useState(todayInputValue());
  const measurementSubmissionInFlight = useRef(false);
  const photoUploadInFlight = useRef(false);

  useEffect(() => () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  }, [photoPreviewUrl]);

  const latestMeasurement = overview.measurements[0] ?? null;
  const calculatedBodyFatPercentage = draftWeightKg.trim() !== "" && draftFatMassKg.trim() !== ""
    ? calculateBodyFatPercentage(
      Number(draftWeightKg.replace(",", ".")),
      Number(draftFatMassKg.replace(",", ".")),
    )
    : null;
  const latestDetails = useMemo(
    () => latestMeasurement
      ? LATEST_MEASUREMENT_FIELDS.flatMap(({ key }) => latestMeasurement[key] == null ? [] : [{ field: key, value: latestMeasurement[key] }])
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
    if (isSaving || measurementSubmissionInFlight.current) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const input: BodyMeasurementInput = {
      recordedAt: String(formData.get("recordedAt") ?? ""),
      heightCm: parseOptionalNumber(formData, "heightCm"),
    };
    for (const field of BODY_MEASUREMENT_FIELDS) input[field] = parseOptionalNumber(formData, field);

    measurementSubmissionInFlight.current = true;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/evolution/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; measurement?: EvolutionOverview["measurements"][number] } | null;
      if (!response.ok || !payload?.ok || !payload.measurement) throw new Error("save_failed");
      const measurement = payload.measurement;
      setOverview((current) => ({
        ...current,
        measurements: [measurement, ...current.measurements],
        currentWeightKg: measurement.weightKg ?? current.currentWeightKg,
      }));
      form.reset();
      setMeasurementDate(todayInputValue());
      setDraftWeightKg("");
      setDraftFatMassKg("");
      setFormOpen(false);
      setSuccess("Relevé enregistré.");
      void refreshOverview().catch(() => undefined);
    } catch {
      setError("Le relevé n'a pas pu être enregistré. Vérifie les valeurs et réessaie.");
    } finally {
      setIsSaving(false);
      measurementSubmissionInFlight.current = false;
    }
  }

  async function removeMeasurement(measurementId: string) {
    if (deletingId || !window.confirm("Supprimer ce relevé ?")) return;
    setDeletingId(measurementId);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/evolution/measurements/${encodeURIComponent(measurementId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete_failed");
      setOverview((current) => ({ ...current, measurements: current.measurements.filter((measurement) => measurement.id !== measurementId) }));
      setExpandedMeasurementId((current) => current === measurementId ? null : current);
      setMeasurementMenuId(null);
      void refreshOverview().catch(() => undefined);
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
    if (!file) {
      logProgressPhotoPipeline("selection_cancelled");
      return;
    }

    logProgressPhotoPipeline("file_selected", describePhotoFile(file));

    if (!isSupportedSourcePhotoMimeType(file.type) || file.size > MAX_SOURCE_PHOTO_BYTES) {
      logProgressPhotoPipeline("selection_rejected", describePhotoFile(file));
      setError("Choisis une image JPEG, PNG ou WebP de 8 Mo maximum.");
      event.target.value = "";
      return;
    }

    setError(null);
    setSuccess(null);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photoFile || isUploadingPhoto || photoUploadInFlight.current) return;
    const form = event.currentTarget;

    photoUploadInFlight.current = true;
    setIsUploadingPhoto(true);
    setError(null);
    try {
      const uploadFile = await preparePhotoForPrivateUpload(photoFile);
      const formData = new FormData();
      formData.set("file", uploadFile);
      formData.set("recordedAt", photoDate);
      formData.set("view", photoView);
      logProgressPhotoPipeline("upload_started", { mimeType: uploadFile.type, byteSize: uploadFile.size });
      const response = await fetch("/api/evolution/photos", { method: "POST", body: formData });
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string; photo?: ProgressPhotoItem } | null;
      const photo = payload?.photo;
      logProgressPhotoPipeline("upload_response", { status: response.status, ok: payload?.ok === true, error: payload?.error ?? null });
      if (!response.ok || !payload?.ok || !photo) throw new Error(payload?.error ?? "photo_upload_failed");
      setOverview((current) => ({ ...current, photos: [photo, ...current.photos], galleryCount: current.galleryCount + 1 }));
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
      setPhotoFile(null);
      form.reset();
      setSuccess("Photo ajoutée à ta galerie privée.");
      void refreshOverview().catch(() => undefined);
    } catch (error) {
      const code = getPhotoErrorCode(error);
      logProgressPhotoPipeline("upload_failed", { code });
      setError(getPhotoErrorMessage(code));
    } finally {
      setIsUploadingPhoto(false);
      photoUploadInFlight.current = false;
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
              <label><span className="field-label">Date du relevé</span><TraknioDatePicker name="recordedAt" value={measurementDate} onValueChange={setMeasurementDate} /></label>
              <label><span className="field-label">Taille (cm)</span><input className="input" name="heightCm" type="number" min="80" max="250" step="1" defaultValue={overview.profile.heightCm ?? ""} /></label>
            </div>
            {FIELD_GROUPS.map((group) => (
              <fieldset key={group.title} className="evolution-fieldset">
                <legend>{group.title}</legend>
                <div className="evolution-input-grid">
                  {group.fields.map((field) => (
                    <label key={field.key}>
                      <span className="field-label">{field.label} ({field.suffix})</span>
                      <input
                        className="input"
                        name={field.key}
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        value={field.key === "weightKg" ? draftWeightKg : field.key === "fatMassKg" ? draftFatMassKg : undefined}
                        onChange={field.key === "weightKg" ? (event) => setDraftWeightKg(event.target.value) : field.key === "fatMassKg" ? (event) => setDraftFatMassKg(event.target.value) : undefined}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            {calculatedBodyFatPercentage != null ? <p className="evolution-fat-percentage">Taux de masse grasse calculé : <b>{formatValue(calculatedBodyFatPercentage, "%")}</b></p> : null}
            <PrimaryButton type="submit" disabled={isSaving}>{isSaving ? "Enregistrement..." : "Enregistrer le relevé"}</PrimaryButton>
          </form>
        ) : null}

        {error ? <p className="settings-danger-error">{error}</p> : null}
        {success ? <p className="evolution-success" role="status">{success}</p> : null}

        {latestDetails.length === 0 ? (
          <p className="muted">Ajoute un premier relevé pour suivre ton évolution dans le temps.</p>
        ) : (
          <div className="evolution-latest-grid">
            {latestDetails.slice(0, 6).map(({ field, value }) => {
              const detail = getMeasurementDetail(field);
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
        <div className="evolution-gallery-actions">
          {overview.photos.length > 1 ? <button type="button" className="ghost-btn evolution-compare-trigger" onClick={() => setComparisonOpen(true)}>Comparer</button> : null}
          <StatBadge tone="violet">Privée</StatBadge>
        </div>

        <form className="evolution-photo-form" onSubmit={uploadPhoto}>
          <label className="evolution-photo-picker">
            <span className="field-label">Photo JPEG, PNG ou WebP · 8 Mo max.</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} required />
          </label>
          <div className="form-grid evolution-photo-controls">
            <label>
              <span className="field-label">Orientation</span>
              <BrandSelect options={PHOTO_VIEWS} value={photoView} onValueChange={(value) => setPhotoView(value as ProgressPhotoView)} />
            </label>
            <label>
              <span className="field-label">Date</span>
              <TraknioDatePicker className="evolution-photo-date-picker" value={photoDate} onValueChange={setPhotoDate} />
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

      <ProgressPhotoComparison
        photos={overview.photos}
        measurements={overview.measurements}
        viewLabels={Object.fromEntries(PHOTO_VIEWS.map((item) => [item.value, item.label])) as Record<ProgressPhotoView, string>}
        isOpen={comparisonOpen}
        onOpenChange={setComparisonOpen}
      />

      {overview.measurements.length > 0 ? (
        <GlassCard className="evolution-history-card">
          <p className="fit-section-title__eyebrow">Historique</p>
          <h2>Derniers relevés</h2>
          <div className="evolution-history-list">
            {overview.measurements.map((measurement) => (
              <article key={measurement.id} className={expandedMeasurementId === measurement.id ? "is-expanded" : ""}>
                <button type="button" className="evolution-history-summary" onClick={() => setExpandedMeasurementId((current) => current === measurement.id ? null : measurement.id)} aria-expanded={expandedMeasurementId === measurement.id}>
                  <span><strong>{formatDate(measurement.recordedAt)}</strong><p>{measurementSummary(measurement)}</p></span>
                  <i aria-hidden="true">⌄</i>
                </button>
                <div className="evolution-history-actions">
                  <button type="button" className="evolution-history-menu" aria-label="Actions du relevé" aria-expanded={measurementMenuId === measurement.id} onClick={() => setMeasurementMenuId((current) => current === measurement.id ? null : measurement.id)}>⋯</button>
                  {measurementMenuId === measurement.id ? <div className="evolution-history-menu-panel"><button type="button" disabled={deletingId === measurement.id} onClick={() => void removeMeasurement(measurement.id)}>{deletingId === measurement.id ? "Suppression..." : "Supprimer"}</button></div> : null}
                </div>
                {expandedMeasurementId === measurement.id ? <div className="evolution-history-details">{MEASUREMENT_DISPLAY_FIELDS.flatMap((field) => {
                  const value = measurement[field.key];
                  return value != null ? <span key={field.key}><small>{field.label}</small><b>{formatValue(value, field.suffix)}</b></span> : [];
                })}{measurement.bodyFatPercentage != null ? <span><small>Taux de masse grasse</small><b>{formatValue(measurement.bodyFatPercentage, "%")}</b></span> : null}</div> : null}
              </article>
            ))}
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
