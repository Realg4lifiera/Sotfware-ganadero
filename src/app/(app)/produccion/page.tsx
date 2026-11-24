import type { Metadata } from "next";
import { PaginaSeccion } from "@/components/pagina-seccion";

export const metadata: Metadata = { title: "Producción" };

export default function Pagina() {
  return (
    <PaginaSeccion
      titulo="Producción"
      descripcion="Gestión productiva: leche, pesos, potreros, alimentación y sanidad."
    />
  );
}
