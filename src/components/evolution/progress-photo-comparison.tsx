"use client";

import { useState, type CSSProperties } from "react";
import { GlassCard } from "@/src/components/ui/glass-card";
import {
  canCompareProgressPhotos,
  createProgressPhotoComparison,
  photosForComparisonView,
} from "@/src/lib/progress-photo-comparison";
import type { BodyMeasurementItem, ProgressPhotoItem, ProgressPhotoView } from "@/src/types/body-evolution";

type ProgressPhotoComparisonProps = {
  photos: ProgressPhotoItem[];
  measurements: BodyMeasurementItem[];
  viewLabels: Record<ProgressPhotoView, string>;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatValue(value: number, unit: string) {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${unit}`;
}

function formatElapsed(days: number) {
  if (days < 7) return `${days} jour${days > 1 ? "s" : ""}`;
  const weeks = Math.round(days / 7);
  return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
}

export function ProgressPhotoComparison({ photos, measurements, viewLabels, isOpen, onOpenChange }: ProgressPhotoComparisonProps) {
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [mode, setMode] = useState<"side-by-side" | "slider">("side-by-side");
  const [sliderPosition, setSliderPosition] = useState(50);

  const before = photos.find((photo) => photo.id === beforeId) ?? null;
  const candidates = before ? photosForComparisonView(photos, before.view).filter((photo) => photo.id !== before.id) : [];
  const after = candidates.find((photo) => photo.id === afterId) ?? null;
  const comparison = createProgressPhotoComparison(before, after, measurements);
  const comparableViews = new Set(photos.filter((photo) => photos.some((candidate) => candidate.id !== photo.id && candidate.view === photo.view)).map((photo) => photo.view));

  function selectBefore(photoId: string) {
    setBeforeId(photoId);
    setAfterId("");
  }

  if (!isOpen) return null;

  return (
    <GlassCard className="evolution-comparison-card">
      <div className="evolution-comparison-head">
        <div>
          <p className="fit-section-title__eyebrow">Avant / Maintenant</p>
          <h2>Comparer ma progression</h2>
        </div>
        <button type="button" className="ghost-btn" onClick={() => onOpenChange(false)}>Fermer</button>
      </div>

      {photos.length < 2 || comparableViews.size === 0 ? (
        <p className="muted">Ajoute au moins deux photos de la même orientation pour comparer ta progression.</p>
      ) : (
        <>
          <div className="evolution-comparison-selectors">
            <label>
              <span className="field-label">Photo Avant</span>
              <select className="input" value={beforeId} onChange={(event) => selectBefore(event.target.value)}>
                <option value="">Choisir une photo</option>
                {photos.filter((photo) => comparableViews.has(photo.view)).map((photo) => <option key={photo.id} value={photo.id}>{viewLabels[photo.view]} · {formatDate(photo.recordedAt)}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">Photo Maintenant</span>
              <select className="input" value={afterId} disabled={!before} onChange={(event) => setAfterId(event.target.value)}>
                <option value="">Choisir une photo</option>
                {candidates.map((photo) => <option key={photo.id} value={photo.id}>{formatDate(photo.recordedAt)}</option>)}
              </select>
            </label>
          </div>

          {!before || !after ? <p className="muted">Choisis une photo Avant et une photo Maintenant de la même orientation.</p> : null}
          {before && after && canCompareProgressPhotos(before, after) ? (
            <>
              <div className="evolution-comparison-mode" role="group" aria-label="Mode d'affichage">
                <button type="button" className={mode === "side-by-side" ? "is-active" : ""} onClick={() => setMode("side-by-side")}>Côte à côte</button>
                <button type="button" className={mode === "slider" ? "is-active" : ""} onClick={() => setMode("slider")}>Comparateur</button>
              </div>

              {mode === "side-by-side" ? (
                <div className="evolution-comparison-images">
                  <figure>
                    {/* Authenticated image routes cannot be fetched through next/image. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={before.imageUrl} alt={`Avant, ${viewLabels[before.view].toLowerCase()} du ${formatDate(before.recordedAt)}`} />
                    <figcaption><b>Avant</b><span>{formatDate(before.recordedAt)}</span></figcaption>
                  </figure>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={after.imageUrl} alt={`Maintenant, ${viewLabels[after.view].toLowerCase()} du ${formatDate(after.recordedAt)}`} />
                    <figcaption><b>Maintenant</b><span>{formatDate(after.recordedAt)}</span></figcaption>
                  </figure>
                </div>
              ) : (
                <div className="evolution-comparison-slider" style={{ "--comparison-position": `${sliderPosition}%` } as CSSProperties}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={after.imageUrl} alt={`Maintenant, ${viewLabels[after.view].toLowerCase()} du ${formatDate(after.recordedAt)}`} />
                  <div className="evolution-comparison-slider-before">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={before.imageUrl} alt="" aria-hidden="true" />
                  </div>
                  <span className="evolution-comparison-slider-label is-before">Avant</span><span className="evolution-comparison-slider-label is-after">Maintenant</span>
                  <input type="range" min="0" max="100" value={sliderPosition} aria-label="Révéler la photo Avant ou Maintenant" onChange={(event) => setSliderPosition(Number(event.target.value))} />
                </div>
              )}

              {comparison ? <div className="evolution-comparison-summary"><strong>{formatElapsed(comparison.elapsedDays)}</strong>{comparison.metrics.map((metric) => <p key={metric.field}>{metric.label} : {formatValue(metric.before, metric.unit)} → {formatValue(metric.after, metric.unit)} <b>({metric.difference > 0 ? "+" : ""}{formatValue(metric.difference, metric.unit)})</b></p>)}{comparison.metrics.length === 0 ? <p className="muted">Aucune mensuration suffisamment proche de ces dates n’est disponible.</p> : null}</div> : null}
            </>
          ) : null}
        </>
      )}
    </GlassCard>
  );
}
