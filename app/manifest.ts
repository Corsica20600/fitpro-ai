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
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

