/** Rotación de potreros (Módulo 3). */
import { z } from "zod";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { hoy } from "@/lib/fechas";

export const CAMPOS_ROTACION: DefCampo[] = [
  { nombre: "loteId", etiqueta: "Lote", tipo: "opcion", requerido: true, opcionesDe: "lotes" },
  {
    nombre: "potreroId",
    etiqueta: "Potrero al que entra",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "potreros",
  },
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  {
    nombre: "observaciones",
    etiqueta: "Observaciones",
    tipo: "texto",
    max: 200,
    anchoCompleto: true,
  },
];

export const esquemaRotacion = esquemaDesdeCampos(CAMPOS_ROTACION).superRefine(
  (d: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const f = d.fecha as Date | null;
    if (f && f > hoy())
      ctx.addIssue({ code: "custom", path: ["fecha"], message: "No puede ser una fecha futura." });
  },
);
