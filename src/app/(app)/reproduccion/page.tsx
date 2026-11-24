import type { Metadata } from "next";
import { PaginaSeccion } from "@/components/pagina-seccion";

export const metadata: Metadata = { title: "Reproducción" };

export default function Pagina() {
  return (
    <PaginaSeccion
      titulo="Reproducción"
      descripcion="Gestión reproductiva: celos, servicios, diagnósticos, partos y alertas."
    />
  );
}
