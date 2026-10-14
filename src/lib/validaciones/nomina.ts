/** Pago de nómina (Módulo 1). Los conceptos se digitan a mano. */
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { hoy } from "@/lib/fechas";
import { parsearNumeroCO } from "@/lib/formato";
import { CONCEPTOS_NOMINA, totalesNomina, type ValoresNomina } from "@/lib/dominio/nomina";

const pesos = (nombre: string, etiqueta: string, ayuda?: string): DefCampo => ({
  nombre,
  etiqueta,
  tipo: "decimal",
  min: 0,
  sufijo: "COP",
  porDefecto: "0",
  ayuda,
});

export const CAMPOS_PAGO_GENERAL: DefCampo[] = [
  {
    nombre: "trabajadorId",
    etiqueta: "Trabajador",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "trabajadores",
  },
  { nombre: "fecha", etiqueta: "Fecha de pago", tipo: "fecha", requerido: true },
  {
    nombre: "centroCostoId",
    etiqueta: "Centro de costo",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "centros",
  },
  { nombre: "periodoInicio", etiqueta: "Período desde", tipo: "fecha" },
  { nombre: "periodoFin", etiqueta: "Período hasta", tipo: "fecha" },
  { nombre: "labor", etiqueta: "Labor", tipo: "texto", max: 120 },
  { nombre: "jornales", etiqueta: "Jornales o días", tipo: "decimal", min: 0 },
  { nombre: "loteId", etiqueta: "Lote (opcional)", tipo: "opcion", opcionesDe: "lotes" },
];

export const CAMPOS_PAGO_DEVENGADO: DefCampo[] = [
  { ...pesos("salario", "Salario"), requerido: true },
  pesos("auxilioTransporte", "Auxilio de transporte"),
  pesos("bonificacion", "Bonificación"),
];

export const CAMPOS_PAGO_SEGURIDAD: DefCampo[] = [
  pesos("salud", "Salud"),
  pesos("pension", "Pensión"),
  pesos("arl", "ARL"),
  {
    nombre: "nivelRiesgoArl",
    etiqueta: "Nivel de riesgo ARL",
    tipo: "opcion",
    opciones: [1, 2, 3, 4, 5].map((n) => ({ valor: String(n), etiqueta: `Riesgo ${n}` })),
  },
];

export const CAMPOS_PAGO_PRESTACIONES: DefCampo[] = [
  pesos("prima", "Prima"),
  pesos("vacaciones", "Vacaciones"),
  pesos("cesantias", "Cesantías"),
  pesos("interesesCesantias", "Intereses de cesantías"),
  { nombre: "nota", etiqueta: "Nota", tipo: "textarea", anchoCompleto: true },
];

export const CAMPOS_PAGO = [
  ...CAMPOS_PAGO_GENERAL,
  ...CAMPOS_PAGO_DEVENGADO,
  ...CAMPOS_PAGO_SEGURIDAD,
  ...CAMPOS_PAGO_PRESTACIONES,
];

export const esquemaPago = esquemaDesdeCampos(CAMPOS_PAGO).superRefine((d, ctx) => {
  const error = (campo: string, message: string) =>
    ctx.addIssue({ code: "custom", path: [campo], message });
  const fecha = d.fecha as Date | null;
  if (fecha && fecha > hoy()) error("fecha", "No puede ser una fecha futura.");
  const ini = d.periodoInicio as Date | null;
  const fin = d.periodoFin as Date | null;
  if (ini && fin && fin < ini) error("periodoFin", "Debe ser posterior al inicio del período.");
});

/** Totales en vivo a partir de los valores del formulario. */
export function totalesPagoDesdeFormulario(v: Record<string, unknown>) {
  const valores: ValoresNomina = Object.fromEntries(
    CONCEPTOS_NOMINA.map((c) => [c, parsearNumeroCO(String(v[c] ?? "")) ?? 0]),
  );
  return totalesNomina(valores);
}
