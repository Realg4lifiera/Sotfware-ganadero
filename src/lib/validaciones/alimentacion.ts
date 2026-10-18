/** Suministro de alimento por lote (Módulo 3). */
import { z } from "zod";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { hoy } from "@/lib/fechas";

export const CAMPOS_SUMINISTRO: DefCampo[] = [
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  { nombre: "loteId", etiqueta: "Lote", tipo: "opcion", requerido: true, opcionesDe: "lotes" },
  {
    nombre: "insumoId",
    etiqueta: "Alimento o sal",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "insumos",
  },
  {
    nombre: "cantidad",
    etiqueta: "Cantidad (en la unidad del insumo)",
    tipo: "decimal",
    requerido: true,
    min: 0.001,
    max: 1000000,
  },
  {
    nombre: "gastoId",
    etiqueta: "Compra de la que sale",
    tipo: "opcion",
    opcionesDe: "compras",
    ayuda: "Opcional: da el costo estimado del suministro. El costo ya cuenta en Compras.",
    anchoCompleto: true,
  },
  { nombre: "nota", etiqueta: "Nota", tipo: "texto", max: 200, anchoCompleto: true },
];

export const esquemaSuministro = esquemaDesdeCampos(CAMPOS_SUMINISTRO).superRefine(
  (d: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const f = d.fecha as Date | null;
    if (f && f > hoy())
      ctx.addIssue({ code: "custom", path: ["fecha"], message: "No puede ser una fecha futura." });
  },
);
