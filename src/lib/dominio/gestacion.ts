/**
 * Fechas reproductivas (funciones puras). Los días vienen de la configuración de la finca
 * (`configuracion.reproduccion`).
 */

const DIA = 86_400_000;

export const sumarDias = (f: Date, dias: number) => new Date(f.getTime() + dias * DIA);

/** Fecha probable de parto a partir del servicio. */
export function partoDesdeServicio(fechaServicio: Date, diasGestacion: number): Date {
  return sumarDias(fechaServicio, diasGestacion);
}

/**
 * Fecha probable de parto a partir de un diagnóstico positivo: si el veterinario estimó
 * los días de gestación se usan esos; si no, la fecha del servicio; si tampoco hay
 * servicio, no se puede calcular.
 */
export function partoDesdeDiagnostico(
  d: { fecha: Date; diasGestacion: number | null; fechaServicio: Date | null },
  diasGestacion: number,
): Date | null {
  if (d.diasGestacion != null) return sumarDias(d.fecha, diasGestacion - d.diasGestacion);
  if (d.fechaServicio) return partoDesdeServicio(d.fechaServicio, diasGestacion);
  return null;
}

/** Días de gestación a una fecha según la fecha probable de parto. */
export function diasGestacionA(fechaProbableParto: Date, fecha: Date, diasGestacion: number) {
  return diasGestacion - Math.round((fechaProbableParto.getTime() - fecha.getTime()) / DIA);
}

/**
 * Número del servicio dentro del ciclo actual: servicios desde el último parto o aborto
 * (o desde siempre si nunca ha parido/abortado), más el nuevo.
 */
export function numeroServicio(
  serviciosPrevios: Date[],
  inicioCiclo: Date | null,
  fechaNuevo: Date,
): number {
  return (
    serviciosPrevios.filter(
      (f) =>
        (!inicioCiclo || f.getTime() > inicioCiclo.getTime()) &&
        f.getTime() <= fechaNuevo.getTime(),
    ).length + 1
  );
}

/** "AAAA-MM-DD" + "HH:MM" (hora de Bogotá, UTC−5) → instante. Sin hora: mediodía. */
export function fechaHoraBogota(fecha: Date, hora: string | null): Date {
  const m = hora ? /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hora.trim()) : null;
  const [h, min] = m ? [Number(m[1]), Number(m[2])] : [12, 0];
  return new Date(
    Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate(), h + 5, min),
  );
}

export const HORA_VALIDA = /^([01]?\d|2[0-3]):([0-5]\d)$/;
