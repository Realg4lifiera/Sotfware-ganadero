import type { Metadata } from "next";
import { PaginaSeccion } from "@/components/pagina-seccion";

export const metadata: Metadata = { title: "Costos" };

export default function Pagina() {
  return (
    <PaginaSeccion
      titulo="Costos"
      descripcion="Costos de producción: compras, nómina, gastos administrativos, ingresos e indicadores."
    />
  );
}
