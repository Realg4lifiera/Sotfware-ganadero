/** Formularios de eventos reproductivos (Módulo 2). */
import { z } from "zod";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import {
  ETIQUETA_METODO_DIAGNOSTICO,
  ETIQUETA_RESULTADO_DIAGNOSTICO,
  ETIQUETA_TIPO_SERVICIO,
  opciones,
} from "@/lib/etiquetas";
import { HORA_VALIDA } from "@/lib/dominio/gestacion";
import { hoy } from "@/lib/fechas";

const hembra: DefCampo = {
  nombre: "hembraId",
  etiqueta: "Hembra",
  tipo: "opcion",
  requerido: true,
  opcionesDe: "hembras",
  anchoCompleto: true,
};
const fecha: DefCampo = { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true };
const observaciones: DefCampo = {
  nombre: "observaciones",
  etiqueta: "Observaciones",
  tipo: "textarea",
  max: 500,
  anchoCompleto: true,
};

const noFutura = (d: Record<string, unknown>, ctx: z.RefinementCtx) => {
  const f = d.fecha as Date | null;
  if (f && f > hoy())
    ctx.addIssue({ code: "custom", path: ["fecha"], message: "No puede ser una fecha futura." });
};

export const CAMPOS_CELO: DefCampo[] = [
  hembra,
  fecha,
  { nombre: "hora", etiqueta: "Hora", tipo: "texto", max: 5, ayuda: "Opcional, ej.: 06:30" },
  observaciones,
];
export const esquemaCelo = esquemaDesdeCampos(CAMPOS_CELO).superRefine((d, ctx) => {
  noFutura(d, ctx);
  if (d.hora && !HORA_VALIDA.test(String(d.hora)))
    ctx.addIssue({ code: "custom", path: ["hora"], message: "Usa el formato HH:MM (24 horas)." });
});

export const CAMPOS_SERVICIO: DefCampo[] = [
  hembra,
  fecha,
  {
    nombre: "tipo",
    etiqueta: "Tipo de servicio",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_TIPO_SERVICIO),
  },
  { nombre: "pajillaId", etiqueta: "Pajilla", tipo: "opcion", opcionesDe: "pajillas" },
  { nombre: "toroId", etiqueta: "Toro", tipo: "opcion", opcionesDe: "toros" },
  { nombre: "inseminador", etiqueta: "Inseminador", tipo: "texto", max: 80 },
  observaciones,
];
export const esquemaServicio = esquemaDesdeCampos(CAMPOS_SERVICIO).superRefine((d, ctx) => {
  noFutura(d, ctx);
  if (d.tipo === "INSEMINACION" && !d.pajillaId)
    ctx.addIssue({ code: "custom", path: ["pajillaId"], message: "Elige la pajilla usada." });
  if (d.tipo === "MONTA_NATURAL" && !d.toroId)
    ctx.addIssue({ code: "custom", path: ["toroId"], message: "Elige el toro." });
});
/** Campos que solo aplican a un tipo de servicio (para ocultar el otro). */
export const ocultarCampoServicio = (campo: string, v: Record<string, unknown>) =>
  campo === "pajillaId" || campo === "inseminador"
    ? v.tipo !== "INSEMINACION"
    : campo === "toroId"
      ? v.tipo !== "MONTA_NATURAL"
      : false;

export const CAMPOS_DIAGNOSTICO: DefCampo[] = [
  hembra,
  fecha,
  {
    nombre: "metodo",
    etiqueta: "Método",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_METODO_DIAGNOSTICO),
  },
  {
    nombre: "resultado",
    etiqueta: "Resultado",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_RESULTADO_DIAGNOSTICO),
  },
  {
    nombre: "diasGestacion",
    etiqueta: "Días de gestación (estimados)",
    tipo: "entero",
    min: 20,
    max: 300,
    sufijo: "días",
    ayuda: "Opcional. Si se deja vacío, la fecha de parto se calcula desde el servicio.",
  },
  { nombre: "veterinario", etiqueta: "Veterinario", tipo: "texto", max: 80 },
  observaciones,
];
export const esquemaDiagnostico = esquemaDesdeCampos(CAMPOS_DIAGNOSTICO).superRefine(noFutura);
export const ocultarCampoDiagnostico = (campo: string, v: Record<string, unknown>) =>
  campo === "diasGestacion" && v.resultado !== "PRENADA";
