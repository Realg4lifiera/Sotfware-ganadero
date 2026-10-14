/**
 * Pago de nómina (registro de costo, como en Colanta; NO es nómina electrónica DIAN).
 * Los valores se digitan a mano; el sistema solo suma:
 *   costo total = salario + auxilio de transporte + seguridad social (salud, pensión, ARL)
 *               + prestaciones (prima, vacaciones, cesantías, intereses) + bonificación
 */
export const CONCEPTOS_SEGURIDAD_SOCIAL = ["salud", "pension", "arl"] as const;
export const CONCEPTOS_PRESTACIONES = [
  "prima",
  "vacaciones",
  "cesantias",
  "interesesCesantias",
] as const;
export const CONCEPTOS_NOMINA = [
  "salario",
  "auxilioTransporte",
  ...CONCEPTOS_SEGURIDAD_SOCIAL,
  ...CONCEPTOS_PRESTACIONES,
  "bonificacion",
] as const;
export type ConceptoNomina = (typeof CONCEPTOS_NOMINA)[number];

export type ValoresNomina = Partial<Record<ConceptoNomina, number>>;

const centavos = (n: number | undefined) => Math.round(((n ?? 0) + Number.EPSILON) * 100);
const suma = (v: ValoresNomina, conceptos: readonly ConceptoNomina[]) =>
  conceptos.reduce((s, c) => s + centavos(v[c]), 0) / 100;

export function totalesNomina(v: ValoresNomina) {
  return {
    seguridadSocial: suma(v, CONCEPTOS_SEGURIDAD_SOCIAL),
    prestaciones: suma(v, CONCEPTOS_PRESTACIONES),
    costoTotal: suma(v, CONCEPTOS_NOMINA),
  };
}

export interface PagoResumen extends ValoresNomina {
  trabajadorId: string;
}

/** Reporte mensual de mano de obra (como "Reporte Mano de Obra" de Colanta). */
export function reporteManoObra(pagos: PagoResumen[]) {
  const centavosDe = (f: (p: PagoResumen) => number) =>
    pagos.reduce((s, p) => s + Math.round(f(p) * 100), 0) / 100;
  return {
    empleados: new Set(pagos.map((p) => p.trabajadorId)).size,
    pagos: pagos.length,
    salarios: centavosDe((p) => p.salario ?? 0),
    auxilioTransporte: centavosDe((p) => p.auxilioTransporte ?? 0),
    bonificaciones: centavosDe((p) => p.bonificacion ?? 0),
    seguridadSocial: centavosDe((p) => totalesNomina(p).seguridadSocial),
    prestaciones: centavosDe((p) => totalesNomina(p).prestaciones),
    costoTotal: centavosDe((p) => totalesNomina(p).costoTotal),
  };
}
