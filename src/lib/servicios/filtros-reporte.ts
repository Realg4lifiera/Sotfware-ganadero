import { AGRUPACIONES, type Agrupacion } from "@/lib/dominio/reporte-costos";
import { mesActualISO, mesDesdeParametro } from "@/lib/fechas";

/** Filtros del reporte de costos desde la URL (por defecto: año corrido, por rubro). */
export function filtrosReporteCostos(p: Record<string, string | string[] | undefined>) {
  const actual = mesActualISO();
  const hasta = typeof p.hasta === "string" ? mesDesdeParametro(p.hasta) : actual;
  let desde = typeof p.desde === "string" ? mesDesdeParametro(p.desde) : `${hasta.slice(0, 4)}-01`;
  if (desde > hasta) desde = hasta;
  const por = AGRUPACIONES.includes(p.por as Agrupacion) ? (p.por as Agrupacion) : "rubro";
  return { desde, hasta, por };
}
