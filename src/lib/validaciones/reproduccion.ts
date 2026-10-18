/** Formularios de eventos reproductivos (Módulo 2). */
import { z } from "zod";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import {
  ETIQUETA_METODO_DIAGNOSTICO,
  ETIQUETA_RESULTADO_DIAGNOSTICO,
  ETIQUETA_TIPO_PARTO,
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

// ─── Parto ───────────────────────────────────────────────────────────────────

const cria = (n: 1 | 2): DefCampo[] => [
  {
    nombre: `cria${n}_numero`,
    etiqueta: `Cría ${n} · número de chapeta`,
    tipo: "texto",
    max: 30,
  },
  {
    nombre: `cria${n}_sexo`,
    etiqueta: `Cría ${n} · sexo`,
    tipo: "opcion",
    opciones: [
      { valor: "HEMBRA", etiqueta: "Hembra" },
      { valor: "MACHO", etiqueta: "Macho" },
    ],
  },
  { nombre: `cria${n}_nombre`, etiqueta: `Cría ${n} · nombre`, tipo: "texto", max: 60 },
  {
    nombre: `cria${n}_peso`,
    etiqueta: `Cría ${n} · peso al nacer`,
    tipo: "decimal",
    min: 1,
    max: 100,
    sufijo: "kg",
  },
];

export const CAMPOS_PARTO: DefCampo[] = [
  hembra,
  fecha,
  {
    nombre: "tipo",
    etiqueta: "Tipo de parto",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_TIPO_PARTO),
  },
  {
    nombre: "toroId",
    etiqueta: "Padre (toro)",
    tipo: "opcion",
    opcionesDe: "toros",
    ayuda: "Se propone el toro del último servicio.",
  },
  {
    nombre: "numeroCrias",
    etiqueta: "Crías vivas",
    tipo: "opcion",
    requerido: true,
    opciones: [
      { valor: "1", etiqueta: "1" },
      { valor: "2", etiqueta: "2 (mellizos)" },
      { valor: "0", etiqueta: "Ninguna" },
    ],
    ayuda: "Si una cría nació muerta, no la registres: anótalo en observaciones.",
  },
  ...cria(1),
  ...cria(2),
  observaciones,
];

export const esquemaParto = esquemaDesdeCampos(CAMPOS_PARTO).superRefine((d, ctx) => {
  noFutura(d, ctx);
  const n = Number(d.numeroCrias ?? 0);
  for (const i of [1, 2]) {
    if (i > n) continue;
    if (!d[`cria${i}_numero`])
      ctx.addIssue({
        code: "custom",
        path: [`cria${i}_numero`],
        message: "Este dato es obligatorio.",
      });
    if (!d[`cria${i}_sexo`])
      ctx.addIssue({
        code: "custom",
        path: [`cria${i}_sexo`],
        message: "Este dato es obligatorio.",
      });
  }
  if (n === 2 && d.cria1_numero && d.cria1_numero === d.cria2_numero)
    ctx.addIssue({
      code: "custom",
      path: ["cria2_numero"],
      message: "Debe ser distinto de la cría 1.",
    });
});
export const ocultarCampoParto = (campo: string, v: Record<string, unknown>) => {
  const m = /^cria(\d)_/.exec(campo);
  return m ? Number(m[1]) > Number(v.numeroCrias ?? 0) : false;
};

// ─── Aborto, secado y descarte ───────────────────────────────────────────────

export const CAMPOS_ABORTO: DefCampo[] = [
  hembra,
  fecha,
  { nombre: "causa", etiqueta: "Causa", tipo: "texto", max: 120 },
  {
    nombre: "diasGestacion",
    etiqueta: "Días de gestación",
    tipo: "entero",
    min: 1,
    max: 300,
    sufijo: "días",
    ayuda: "Si se deja vacío se calcula con la fecha probable de parto.",
  },
  observaciones,
];
export const esquemaAborto = esquemaDesdeCampos(CAMPOS_ABORTO).superRefine(noFutura);

export const CAMPOS_SECADO: DefCampo[] = [hembra, fecha, observaciones];
export const esquemaSecado = esquemaDesdeCampos(CAMPOS_SECADO).superRefine(noFutura);

export const CAMPOS_DESCARTE: DefCampo[] = [
  hembra,
  fecha,
  {
    nombre: "motivo",
    etiqueta: "Motivo",
    tipo: "texto",
    requerido: true,
    max: 200,
    anchoCompleto: true,
    ayuda: "Ej.: repetidora, problemas de parto, baja producción.",
  },
];
export const esquemaDescarte = esquemaDesdeCampos(CAMPOS_DESCARTE).superRefine(noFutura);
