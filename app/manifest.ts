import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FitAI Pro",
    short_name: "FitAI",
    description: "Coach fitness intelligent",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#0b0f14",
    background_color: "#0b0f14",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
