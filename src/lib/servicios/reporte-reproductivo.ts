import "server-only";
import { ETIQUETA_ESTADO_REPRODUCTIVO } from "@/lib/etiquetas";
import { hoy, rangoMes } from "@/lib/fechas";
import {
  diasAbiertos,
  diasAbiertosEnCurso,
  indicadoresReproductivos,
  intervalosEntrePartos,
  promedio,
} from "@/lib/indicadores/reproduccion";
import { historiasReproductivas } from "@/lib/servicios/indicadores-reproductivos";
import type { EstadoReproductivo } from "@/generated/prisma/enums";

/** Estados en los que la vaca sigue sin preñez (sus días abiertos siguen corriendo). */
const SIN_PRENEZ: string[] = ["PARIDA", "VACIA", "SERVIDA"];

/** Reporte de los 12 meses que terminan en `mes` ("AAAA-MM", incluido). */
export async function reporteReproductivo(mes: string) {
  const { hasta } = rangoMes(mes);
  const desde = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - 12, 1));
  const historias = await historiasReproductivas();
  const enPeriodo = (f: Date) => f >= desde && f < hasta;
  const filas = historias
    .filter((h) => h.estado === "ACTIVO" && (h.partos.length || h.servicios.length))
    .map((h) => {
      const abiertos = diasAbiertos(h.partos, h.concepciones);
      return {
        id: h.id,
        hembra: h.nombre ? `${h.numero} · ${h.nombre}` : h.numero,
        estado: h.estadoReproductivo
          ? ETIQUETA_ESTADO_REPRODUCTIVO[h.estadoReproductivo as EstadoReproductivo]
          : "—",
        partos: h.numeroPartos,
        iepPromedio: promedio(intervalosEntrePartos(h.partos)),
        ultimosDiasAbiertos: abiertos.at(-1) ?? null,
        diasAbiertosHoy: SIN_PRENEZ.includes(h.estadoReproductivo ?? "")
          ? diasAbiertosEnCurso(h.partos, h.concepciones, hoy())
          : null,
        servicios: h.servicios.filter(enPeriodo).length,
        concepciones: h.concepciones.filter(enPeriodo).length,
      };
    });
  return { desde, hasta, indicadores: indicadoresReproductivos(historias, desde, hasta), filas };
}

export type ReporteReproductivo = Awaited<ReturnType<typeof reporteReproductivo>>;
