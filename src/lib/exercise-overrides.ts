export type ExerciseOverride = {
  displayNameFr?: string;
  cueFr?: string;
  primaryMuscleFr?: string;
  cardImage?: string;
  detailImage?: string;
  frameAnimationUrls?: string[];
  frameIntervalMs?: number;
};

const WIDE_GRIP_LAT_PULLDOWN_FR = "Tirage vertical à la machine";

const overrides: Record<string, ExerciseOverride> = {
  "ab-roller": {
    displayNameFr: "Roue abdominale",
    cueFr: "Saisis la roue à deux mains, garde le gainage et avance seulement sans creuser le bas du dos.",
    primaryMuscleFr: "Abdominaux",
  },
  "clock-push-up": {
    displayNameFr: "Pompes horloge",
    cueFr: "Garde le corps gainé et déplace les mains progressivement autour de l'axe sans casser les hanches.",
    primaryMuscleFr: "Pectoraux",
  },
  "lat-pulldown": {
    displayNameFr: WIDE_GRIP_LAT_PULLDOWN_FR,
    cueFr: "Tire avec les coudes vers le bas, serre les omoplates et contrôle la remontée.",
    primaryMuscleFr: "Dos",
    cardImage: "/media/exercises/wide-grip-lat-pulldown/0.jpg",
  },
  "wide-grip-lat-pulldown": {
    displayNameFr: WIDE_GRIP_LAT_PULLDOWN_FR,
    cueFr: "Tire avec les coudes vers le bas, serre les omoplates et contrôle la remontée.",
    primaryMuscleFr: "Dos",
    cardImage: "/media/exercises/wide-grip-lat-pulldown/0.jpg",
  },
};

export function getExerciseOverride(slug: string): ExerciseOverride | null {
  return overrides[slug] ?? null;
}
