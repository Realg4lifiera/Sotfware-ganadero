/**
 * Producción de una lactancia a partir de controles lecheros periódicos (función pura).
 * Fórmulas PENDIENTES DE VALIDACIÓN con el veterinario:
 *
 * - Curva por intervalos de control: del parto al primer control se toma el primer
 *   control; entre controles, una recta; del último control al secado, el último control.
 *   La producción es el área bajo esa curva.
 * - Lactancia cerrada: se integra hasta el secado. Abierta: hasta el último control.
 * - Ajustada a 305 días (proporcional): si lo cubierto llega a 305 días, lo producido
 *   hasta el día 305; si no, promedio diario × 305, marcado como proyectado.
 */

const DIA = 86_400_000;
const dias = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DIA);

export interface ControlDiario {
  fecha: Date;
  /** Litros del día (suma de las jornadas). */
  litros: number;
}

export interface ProduccionLactancia {
  diasEnLeche: number;
  controles: number;
  ultimoControl: ControlDiario | null;
  pico: { litros: number; diasEnLeche: number } | null;
  /** Días cubiertos por la estimación (hasta el secado o el último control). */
  diasCubiertos: number;
  total: number | null;
  promedioDiario: number | null;
  ajustada305: number | null;
  proyectada: boolean;
}

/** Suma las jornadas de cada día. */
export function controlesDiarios(registros: { fecha: Date; litros: number }[]): ControlDiario[] {
  const m = new Map<number, number>();
  for (const r of registros) m.set(r.fecha.getTime(), (m.get(r.fecha.getTime()) ?? 0) + r.litros);
  return [...m.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, litros]) => ({ fecha: new Date(t), litros: Math.round(litros * 100) / 100 }));
}

/** Área bajo la curva de controles entre el día 0 y el día `hasta` (días en leche). */
function integral(puntos: { d: number; v: number }[], hasta: number): number {
  if (puntos.length === 0 || hasta <= 0) return 0;
  let area = 0;
  // Antes del primer control: valor constante del primer control.
  area += puntos[0].v * Math.min(Math.max(puntos[0].d, 0), hasta);
  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1];
    const b = puntos[i];
    if (a.d >= hasta) break;
    const fin = Math.min(b.d, hasta);
    const vFin = a.v + ((b.v - a.v) * (fin - a.d)) / (b.d - a.d || 1);
    area += ((a.v + vFin) / 2) * (fin - a.d);
  }
  const ultimo = puntos[puntos.length - 1];
  if (hasta > ultimo.d) area += ultimo.v * (hasta - Math.max(ultimo.d, 0));
  return area;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function produccionLactancia(
  l: { inicio: Date; fin: Date | null },
  registros: { fecha: Date; litros: number }[],
  hoy: Date,
): ProduccionLactancia {
  const fin = l.fin ?? hoy;
  const controles = controlesDiarios(
    registros.filter((r) => r.fecha >= l.inicio && r.fecha <= fin),
  );
  const puntos = controles.map((c) => ({ d: dias(l.inicio, c.fecha), v: c.litros }));
  const diasEnLeche = dias(l.inicio, fin);
  const ultimo = controles.at(-1) ?? null;
  const pico = puntos.length ? puntos.reduce((m, p) => (p.v > m.v ? p : m), puntos[0]) : null;
  if (!ultimo)
    return {
      diasEnLeche,
      controles: 0,
      ultimoControl: null,
      pico: null,
      diasCubiertos: 0,
      total: null,
      promedioDiario: null,
      ajustada305: null,
      proyectada: false,
    };
  const diasCubiertos = l.fin ? diasEnLeche : puntos[puntos.length - 1].d;
  const total = integral(puntos, diasCubiertos);
  const promedio = diasCubiertos > 0 ? total / diasCubiertos : ultimo.litros;
  const completa = diasCubiertos >= 305;
  return {
    diasEnLeche,
    controles: controles.length,
    ultimoControl: ultimo,
    pico: pico && { litros: pico.v, diasEnLeche: pico.d },
    diasCubiertos,
    total: r1(total),
    promedioDiario: r1(promedio),
    ajustada305: r1(completa ? integral(puntos, 305) : promedio * 305),
    proyectada: !completa,
  };
}
