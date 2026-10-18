/** Pesajes (Módulo 3). */
import { z } from "zod";
import { ETIQUETA_METODO_PESAJE, opciones } from "@/lib/etiquetas";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { hoy } from "@/lib/fechas";

export const MAX_PESO_KG = 1500;

export const CAMPOS_PESAJE: DefCampo[] = [
  {
    nombre: "animalId",
    etiqueta: "Animal",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "animales",
    anchoCompleto: true,
  },
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  {
    nombre: "pesoKg",
    etiqueta: "Peso",
    tipo: "decimal",
    requerido: true,
    min: 1,
    max: MAX_PESO_KG,
    sufijo: "kg",
  },
  {
    nombre: "metodo",
    etiqueta: "Método",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_METODO_PESAJE),
  },
  {
    nombre: "observaciones",
    etiqueta: "Observaciones",
    tipo: "texto",
    max: 200,
    anchoCompleto: true,
  },
];

export const esquemaPesaje = esquemaDesdeCampos(CAMPOS_PESAJE).superRefine(
  (d: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const f = d.fecha as Date | null;
    if (f && f > hoy())
      ctx.addIssue({ code: "custom", path: ["fecha"], message: "No puede ser una fecha futura." });
  },
);
