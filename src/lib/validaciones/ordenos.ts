/** Ordeños (Módulo 3). La planilla por vaca se valida en lib/servicios/ordenos.ts. */
import { z } from "zod";
import { ETIQUETA_JORNADA, opciones } from "@/lib/etiquetas";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { hoy } from "@/lib/fechas";

export const CAMPOS_ORDENO_LOTE: DefCampo[] = [
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  { nombre: "loteId", etiqueta: "Lote", tipo: "opcion", requerido: true, opcionesDe: "lotes" },
  {
    nombre: "jornada",
    etiqueta: "Jornada",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_JORNADA),
  },
  {
    nombre: "litros",
    etiqueta: "Litros del lote",
    tipo: "decimal",
    requerido: true,
    min: 0.1,
    max: 100000,
    sufijo: "L",
  },
];

export const esquemaOrdenoLote = esquemaDesdeCampos(CAMPOS_ORDENO_LOTE).superRefine(
  (d: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const f = d.fecha as Date | null;
    if (f && f > hoy())
      ctx.addIssue({ code: "custom", path: ["fecha"], message: "No puede ser una fecha futura." });
  },
);
