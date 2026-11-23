/**
 * Alertas reproductivas (función pura). Los días vienen de `configuracion.reproduccion`
 * (aprobado: gestación 283, secar 60 días antes del parto, diagnóstico desde 35 días,
 * ciclo de 21 días, 120 días abiertos, aviso de parto 30 días antes).
 */
import type { EstadoReproductivo } from "@/generated/prisma/enums";
import type { ConfiguracionReproduccion } from "./categoria";

const DIA = 86_400_000;
const dias = (desde: Date, hasta: Date) => Math.round((hasta.getTime() - desde.getTime()) / DIA);

export interface SituacionAlerta {
  id: string;
  numero: string;
  nombre: string | null;
  estado: EstadoReproductivo;
  lactanciaAbierta: boolean;
  ultimoParto: Date | null;
  /** Último servicio del ciclo actual (después del último parto o aborto). */
  ultimoServicio: Date | null;
  serviciosCiclo: number;
  /** Hay un diagnóstico posterior al último servicio. */
  diagnosticadaTrasServicio: boolean;
  fechaProbableParto: Date | null;
}

export type TipoAlerta =
  | "PARTO_PROXIMO"
  | "POR_SECAR"
  | "PENDIENTE_DIAGNOSTICO"
  | "CELO_ESPERADO"
  | "VACIA_LARGA"
  | "REPETIDORA";

export interface Alerta {
  tipo: TipoAlerta;
  hembraId: string;
  hembra: string;
  detalle: string;
  /** Para ordenar: días hasta el evento (negativos = atrasado) o días transcurridos. */
  dias: number;
}

export const TITULO_ALERTA: Record<TipoAlerta, string> = {
  PARTO_PROXIMO: "Partos próximos",
  POR_SECAR: "Vacas por secar",
  PENDIENTE_DIAGNOSTICO: "Pendientes de diagnóstico",
  CELO_ESPERADO: "Celo esperado",
  VACIA_LARGA: "Vacías con muchos días abiertos",
  REPETIDORA: "Repetidoras",
};

/** Servicios sin preñez a partir de los cuales una hembra es repetidora. */
export const SERVICIOS_REPETIDORA = 3;
/** Margen (± días) alrededor del día del ciclo para observar el celo. */
const MARGEN_CELO = 3;

const plural = (n: number, s: string) => `${n} ${s}${Math.abs(n) === 1 ? "" : "s"}`;

export function alertasReproductivas(
  hembras: SituacionAlerta[],
  c: ConfiguracionReproduccion,
  hoy: Date,
): Alerta[] {
  const alertas: Alerta[] = [];
  for (const h of hembras) {
    const base = { hembraId: h.id, hembra: h.nombre ? `${h.numero} · ${h.nombre}` : h.numero };
    const gestante = h.estado === "PRENADA" || h.estado === "SECA";

    if (gestante && h.fechaProbableParto) {
      const faltan = dias(hoy, h.fechaProbableParto);
      if (faltan <= c.diasAlertaParto)
        alertas.push({
          ...base,
          tipo: "PARTO_PROXIMO",
          dias: faltan,
          detalle:
            faltan >= 0
              ? `Parto en ${plural(faltan, "día")}`
              : `Parto atrasado ${plural(-faltan, "día")}`,
        });
      const secarEn = faltan - c.diasSecadoAntesParto;
      if (h.estado === "PRENADA" && h.lactanciaAbierta && secarEn <= 0)
        alertas.push({
          ...base,
          tipo: "POR_SECAR",
          dias: secarEn,
          detalle:
            secarEn === 0
              ? "Secar hoy"
              : `Secado atrasado ${plural(-secarEn, "día")} · parto en ${plural(faltan, "día")}`,
        });
    }

    if (h.estado === "SERVIDA" && h.ultimoServicio && !h.diagnosticadaTrasServicio) {
      const desde = dias(h.ultimoServicio, hoy);
      if (desde >= c.diasDiagnostico)
        alertas.push({
          ...base,
          tipo: "PENDIENTE_DIAGNOSTICO",
          dias: desde,
          detalle: `Servida hace ${plural(desde, "día")}`,
        });
      // Celo esperado si el servicio no preñó: alrededor de cada múltiplo del ciclo.
      const enCiclo = desde % c.diasCiclo;
      const cerca = Math.min(enCiclo, c.diasCiclo - enCiclo);
      if (desde >= c.diasCiclo - MARGEN_CELO && cerca <= MARGEN_CELO)
        alertas.push({
          ...base,
          tipo: "CELO_ESPERADO",
          dias: desde,
          detalle: `Día ${desde} desde el servicio: observar repetición de celo`,
        });
    }

    if (!gestante && h.ultimoParto) {
      const abiertos = dias(h.ultimoParto, hoy);
      if (abiertos > c.diasAbiertosMax)
        alertas.push({
          ...base,
          tipo: "VACIA_LARGA",
          dias: abiertos,
          detalle: `${plural(abiertos, "día")} abiertos · ${plural(h.serviciosCiclo, "servicio")}`,
        });
    }

    if (!gestante && h.serviciosCiclo >= SERVICIOS_REPETIDORA)
      alertas.push({
        ...base,
        tipo: "REPETIDORA",
        dias: h.serviciosCiclo,
        detalle: `${plural(h.serviciosCiclo, "servicio")} sin preñez en el ciclo · evaluar descarte`,
      });
  }
  return alertas;
}
