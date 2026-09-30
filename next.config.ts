import type { NextConfig } from "next";

// Polices lues sur le disque par le CV PDF et l'image de partage : à embarquer dans les fonctions Vercel
const FONTS = ["./node_modules/@fontsource/inter/files/inter-latin-*-normal.woff", "./node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-*-normal.woff"];

const nextConfig: NextConfig = {
  // Génération des CV en PDF et traitement d'images côté serveur
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],
  outputFileTracingIncludes: {
    "/api/cv/[slug]": FONTS,
    "/p/[slug]/opengraph-image": FONTS,
  },
  experimental: {
    // Les fichiers passent directement du navigateur au stockage : les formulaires restent légers
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
