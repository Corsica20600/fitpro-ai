export type ExerciseOverride = {
  displayNameFr?: string;
  cardImage?: string;
  detailImage?: string;
  frameAnimationUrls?: string[];
  frameIntervalMs?: number;
};

const WIDE_GRIP_LAT_PULLDOWN_FR = "Tirage vertical à la machine";

const overrides: Record<string, ExerciseOverride> = {
  "lat-pulldown": {
    displayNameFr: WIDE_GRIP_LAT_PULLDOWN_FR,
    cardImage: "/media/exercises/wide-grip-lat-pulldown/fitai/01_card_presentation_tirage_vertical.png",
    detailImage: "/media/exercises/wide-grip-lat-pulldown/fitai/02_fiche_complete_tirage_vertical.png",
  },
  "wide-grip-lat-pulldown": {
    displayNameFr: WIDE_GRIP_LAT_PULLDOWN_FR,
    cardImage: "/media/exercises/wide-grip-lat-pulldown/fitai/01_card_presentation_tirage_vertical.png",
    detailImage: "/media/exercises/wide-grip-lat-pulldown/fitai/02_fiche_complete_tirage_vertical.png",
  },
};

export function getExerciseOverride(slug: string): ExerciseOverride | null {
  return overrides[slug] ?? null;
}
