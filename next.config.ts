import type { NextConfig } from "next";

// La app es 100 % dinámica (todo depende de la sesión y del rol), por eso no
// se usa cacheComponents: cada página se renderiza por solicitud.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["exceljs"],
  experimental: {
    // forbidden() / unauthorized() para rechazar accesos sin permiso.
    authInterrupts: true,
    serverActions: {
      // Fotos de animales y archivos Excel de importación.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
