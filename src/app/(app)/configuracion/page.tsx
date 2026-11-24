import type { Metadata } from "next";
import { PaginaSeccion } from "@/components/pagina-seccion";

export const metadata: Metadata = { title: "Configuración" };

export default function Pagina() {
  return (
    <PaginaSeccion titulo="Configuración" descripcion="Datos de la finca, usuarios y catálogos." />
  );
}
