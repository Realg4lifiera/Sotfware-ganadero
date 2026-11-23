/**
 * Indicadores reproductivos (funciones puras). Fórmulas del glosario de CLAUDE.md,
 * validadas con el veterinario:
 * - IEP: días entre dos partos consecutivos de la misma vaca.
 * - Días abiertos: del parto a la concepción (servicio con preñez confirmada).
 * - Servicios por concepción: servicios / preñeces confirmadas.
 * - Tasa de preñez: hembras preñadas / hembras expuestas (servidas) en el período.
 * - Edad al primer parto: edad de la hembra en su primer parto.
 */

const DIA = 86_400_000;
const diasEntre = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DIA);
const ordenar = (f: Date[]) => [...f].sort((a, b) => a.getTime() - b.getTime());

export interface HistoriaReproductiva {
  id: string;
  fechaNacimiento: Date | null;
  /** Partos totales (incluye los anteriores a su registro en el sistema). */
  numeroPartos: number;
  partos: Date[];
  servicios: Date[];
  /** Fecha del servicio que preñó (de cada diagnóstico positivo con servicio). */
  concepciones: Date[];
}

export const promedio = (xs: number[]) =>
  xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null;

/** Intervalos entre partos consecutivos, en días. */
export function intervalosEntrePartos(partos: Date[]): number[] {
  const p = ordenar(partos);
  return p.slice(1).map((f, i) => diasEntre(p[i], f));
}

/** Días abiertos de cada parto que ya tiene una concepción posterior. */
export function diasAbiertos(partos: Date[], concepciones: Date[]): number[] {
  const c = ordenar(concepciones);
  return ordenar(partos).flatMap((p) => {
    const siguiente = c.find((x) => x > p);
    return siguiente ? [diasEntre(p, siguiente)] : [];
  });
}

/**
 * Días abiertos que lleva hoy una vaca que todavía no ha quedado preñada: desde su último
 * parto hasta `referencia`. Null si no ha parido o ya concibió después del último parto.
 */
export function diasAbiertosEnCurso(
  partos: Date[],
  concepciones: Date[],
  referencia: Date,
): number | null {
  const ultimo = ordenar(partos).at(-1);
  if (!ultimo || concepciones.some((c) => c > ultimo)) return null;
  return diasEntre(ultimo, referencia);
}

/**
 * Edad al primer parto en días; solo si el primer parto está registrado (todos sus partos
 * están en el sistema) y se conoce la fecha de nacimiento.
 */
export function edadPrimerParto(h: HistoriaReproductiva): number | null {
  if (!h.fechaNacimiento || h.partos.length === 0 || h.partos.length !== h.numeroPartos)
    return null;
  return diasEntre(h.fechaNacimiento, ordenar(h.partos)[0]);
}

export interface IndicadoresReproductivos {
  iepPromedio: number | null;
  diasAbiertosPromedio: number | null;
  serviciosPorConcepcion: number | null;
  tasaPrenez: number | null;
  edadPrimerPartoMeses: number | null;
  /** Bases de cálculo (para mostrar "n = …"). */
  n: {
    iep: number;
    diasAbiertos: number;
    servicios: number;
    concepciones: number;
    expuestas: number;
    primerParto: number;
  };
}

const enPeriodo = (f: Date, desde: Date, hasta: Date) => f >= desde && f < hasta;

/** Indicadores del hato para eventos ocurridos en [desde, hasta). */
export function indicadoresReproductivos(
  hembras: HistoriaReproductiva[],
  desde: Date,
  hasta: Date,
): IndicadoresReproductivos {
  const iep: number[] = [];
  const abiertos: number[] = [];
  const edades: number[] = [];
  let servicios = 0;
  let concepciones = 0;
  let expuestas = 0;
  let prenadas = 0;
  for (const h of hembras) {
    // IEP y días abiertos se asignan al período del evento que los cierra.
    const p = ordenar(h.partos);
    p.slice(1).forEach((f, i) => {
      if (enPeriodo(f, desde, hasta)) iep.push(diasEntre(p[i], f));
    });
    const c = ordenar(h.concepciones);
    for (const parto of p) {
      const sig = c.find((x) => x > parto);
      if (sig && enPeriodo(sig, desde, hasta)) abiertos.push(diasEntre(parto, sig));
    }
    const edad = edadPrimerParto(h);
    if (edad != null && enPeriodo(p[0], desde, hasta)) edades.push(edad);

    const serviciosPeriodo = h.servicios.filter((f) => enPeriodo(f, desde, hasta)).length;
    const concepcionesPeriodo = c.filter((f) => enPeriodo(f, desde, hasta)).length;
    servicios += serviciosPeriodo;
    concepciones += concepcionesPeriodo;
    if (serviciosPeriodo > 0) {
      expuestas++;
      if (concepcionesPeriodo > 0) prenadas++;
    }
  }
  const edadDias = promedio(edades);
  return {
    iepPromedio: promedio(iep),
    diasAbiertosPromedio: promedio(abiertos),
    serviciosPorConcepcion: concepciones
      ? Math.round((servicios / concepciones) * 100) / 100
      : null,
    tasaPrenez: expuestas ? prenadas / expuestas : null,
    edadPrimerPartoMeses: edadDias == null ? null : Math.round((edadDias / 30.4375) * 10) / 10,
    n: {
      iep: iep.length,
      diasAbiertos: abiertos.length,
      servicios,
      concepciones,
      expuestas,
      primerParto: edades.length,
    },
  };
}
