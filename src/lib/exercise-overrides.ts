export type ExerciseOverride = {
  displayNameFr?: string;
  cardImage?: string;
  detailImage?: string;
  frameAnimationUrls?: string[];
  frameIntervalMs?: number;
};

const WIDE_GRIP_LAT_PULLDOWN_FR = "Tirage vertical à la machine";

const overrides: Record<string, ExerciseOverride> = {
  "wide-grip-lat-pulldown": {
    displayNameFr: WIDE_GRIP_LAT_PULLDOWN_FR,
    cardImage: "/media/exercises/wide-grip-lat-pulldown/fitai/01_card_presentation_tirage_vertical.png",
    detailImage: "/media/exercises/wide-grip-lat-pulldown/fitai/02_fiche_complete_tirage_vertical.png",
    frameAnimationUrls: [
      "/media/exercises/wide-grip-lat-pulldown/fitai/frame_01_depart.png",
      "/media/exercises/wide-grip-lat-pulldown/fitai/frame_02_traction.png",
      "/media/exercises/wide-grip-lat-pulldown/fitai/frame_03_contraction.png",
      "/media/exercises/wide-grip-lat-pulldown/fitai/frame_04_retour_controle.png",
      "/media/exercises/wide-grip-lat-pulldown/fitai/frame_05_position_depart.png",
    ],
    frameIntervalMs: 700,
  },
};

export function getExerciseOverride(slug: string): ExerciseOverride | null {
  return overrides[slug] ?? null;
}
