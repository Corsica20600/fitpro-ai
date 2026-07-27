import type { ReactNode } from "react";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";

export const metadata = privatePageMetadata(
  "Montre",
  "Interface montre privée FitAI Pro pour la synchronisation Wear OS.",
);

export default function WatchLayout({ children }: { children: ReactNode }) {
  return children;
}
