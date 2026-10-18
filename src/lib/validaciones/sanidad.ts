/** Eventos sanitarios (Módulo 3). */
import { z } from "zod";
import { ETIQUETA_TIPO_EVENTO_SANITARIO, opciones } from "@/lib/etiquetas";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { hoy } from "@/lib/fechas";

const dias = (nombre: string, etiqueta: string): DefCampo => ({
  nombre,
  etiqueta,
  tipo: "entero",
  min: 0,
  max: 365,
  sufijo: "días",
  ayuda: "Según la etiqueta del producto. Vacío = sin retiro.",
});

export const CAMPOS_SANITARIO: DefCampo[] = [
  {
    nombre: "tipo",
    etiqueta: "Tipo",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_TIPO_EVENTO_SANITARIO),
  },
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  {
    nombre: "aplicaA",
    etiqueta: "Aplicado a",
    tipo: "opcion",
    requerido: true,
    opciones: [
      { valor: "ANIMAL", etiqueta: "Un animal" },
      { valor: "LOTE", etiqueta: "Un lote completo" },
    ],
  },
  { nombre: "animalId", etiqueta: "Animal", tipo: "opcion", opcionesDe: "animales" },
  { nombre: "loteId", etiqueta: "Lote", tipo: "opcion", opcionesDe: "lotes" },
  { nombre: "insumoId", etiqueta: "Producto del catálogo", tipo: "opcion", opcionesDe: "insumos" },
  { nombre: "producto", etiqueta: "Producto", tipo: "texto", requerido: true, max: 120 },
  { nombre: "dosis", etiqueta: "Dosis", tipo: "texto", max: 60, ayuda: "Ej.: 5 ml" },
  { nombre: "via", etiqueta: "Vía", tipo: "texto", max: 40, ayuda: "Ej.: intramuscular" },
  { nombre: "diagnostico", etiqueta: "Diagnóstico", tipo: "texto", max: 200 },
  dias("diasRetiroLeche", "Retiro de leche"),
  dias("diasRetiroCarne", "Retiro de carne"),
  { nombre: "veterinario", etiqueta: "Veterinario", tipo: "texto", max: 80 },
  {
    nombre: "observaciones",
    etiqueta: "Observaciones",
    tipo: "textarea",
    max: 500,
    anchoCompleto: true,
  },
];

export const esquemaSanitario = esquemaDesdeCampos(CAMPOS_SANITARIO).superRefine(
  (d: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const f = d.fecha as Date | null;
    if (f && f > hoy())
      ctx.addIssue({ code: "custom", path: ["fecha"], message: "No puede ser una fecha futura." });
    if (d.aplicaA === "ANIMAL" && !d.animalId)
      ctx.addIssue({ code: "custom", path: ["animalId"], message: "Elige el animal." });
    if (d.aplicaA === "LOTE" && !d.loteId)
      ctx.addIssue({ code: "custom", path: ["loteId"], message: "Elige el lote." });
  },
);

export const ocultarCampoSanitario = (campo: string, v: Record<string, unknown>) =>
  campo === "animalId"
    ? v.aplicaA !== "ANIMAL"
    : campo === "loteId"
      ? v.aplicaA !== "LOTE"
      : campo === "diagnostico"
        ? v.tipo !== "TRATAMIENTO"
        : false;
