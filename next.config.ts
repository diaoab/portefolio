import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Génération des CV en PDF côté serveur
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],
  experimental: {
    serverActions: { bodySizeLimit: "110mb" },
  },
};

export default nextConfig;

