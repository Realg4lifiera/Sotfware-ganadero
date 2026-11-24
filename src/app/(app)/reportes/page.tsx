import type { Metadata } from "next";
import { PaginaSeccion } from "@/components/pagina-seccion";

export const metadata: Metadata = { title: "Reportes" };

export default function Pagina() {
  return (
    <PaginaSeccion
      titulo="Reportes"
      descripcion="Informes filtrables, exportables a PDF y Excel."
    />
  );
}
