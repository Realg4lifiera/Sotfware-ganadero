/** Gastos administrativos / costos indirectos (Módulo 1). */
import { z } from "zod";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { ETIQUETA_PERIODICIDAD, opciones } from "@/lib/etiquetas";
import { parsearNumeroCO } from "@/lib/formato";

export const CAMPOS_COSTO_INDIRECTO: DefCampo[] = [
  {
    nombre: "categoriaId",
    etiqueta: "Concepto",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "categorias",
  },
  {
    nombre: "fecha",
    etiqueta: "Inicio del período",
    tipo: "fecha",
    requerido: true,
    ayuda: "Mes desde el que se reparte.",
  },
  {
    nombre: "periodicidad",
    etiqueta: "Período que cubre",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_PERIODICIDAD),
    porDefecto: "MENSUAL",
  },
  {
    nombre: "valorTotal",
    etiqueta: "Valor total",
    tipo: "decimal",
    requerido: true,
    min: 0,
    sufijo: "COP",
  },
  {
    nombre: "litros",
    etiqueta: "Litros transportados",
    tipo: "decimal",
    min: 0,
    sufijo: "L",
    ayuda: "Solo para transporte de leche: permite calcular el costo por litro.",
  },
  { nombre: "proveedorId", etiqueta: "Proveedor", tipo: "opcion", opcionesDe: "proveedores" },
];

export const CAMPOS_COSTO_INDIRECTO_ASIGNACION: DefCampo[] = [
  {
    nombre: "centroCostoId",
    etiqueta: "Centro de costo",
    tipo: "opcion",
    opcionesDe: "centros",
    ayuda: "Si el gasto es de un solo centro.",
  },
  {
    nombre: "reglaProrrateoId",
    etiqueta: "Regla de prorrateo",
    tipo: "opcion",
    opcionesDe: "reglas",
    ayuda: "Si se reparte entre varios centros.",
  },
  { nombre: "nota", etiqueta: "Nota", tipo: "textarea", anchoCompleto: true },
];

export const CAMPOS_COSTO_INDIRECTO_TODOS = [
  ...CAMPOS_COSTO_INDIRECTO,
  ...CAMPOS_COSTO_INDIRECTO_ASIGNACION,
];

export const esquemaCostoIndirecto = esquemaDesdeCampos(CAMPOS_COSTO_INDIRECTO_TODOS).superRefine(
  (d, ctx) => {
    if (!d.centroCostoId && !d.reglaProrrateoId)
      ctx.addIssue({
        code: "custom",
        path: ["centroCostoId"],
        message: "Elige un centro de costo o una regla de prorrateo.",
      });
    if (d.centroCostoId && d.reglaProrrateoId)
      ctx.addIssue({
        code: "custom",
        path: ["reglaProrrateoId"],
        message: "Usa un centro de costo o una regla, no ambos.",
      });
  },
);

/** Regla de prorrateo: nombre + filas (centro, %). */
export const esquemaRegla = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre.").max(80),
  descripcion: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => v || null),
  detalles: z
    .array(
      z.object({
        centroCostoId: z.string().min(1, "Elige el centro."),
        porcentaje: z.string().transform((v, ctx) => {
          const n = parsearNumeroCO(v);
          if (n === null || n <= 0 || n > 100) {
            ctx.addIssue({ code: "custom", message: "Entre 0 y 100." });
            return 0;
          }
          return n;
        }),
      }),
    )
    .min(1, "Agrega al menos un centro de costo."),
});
export type ValoresRegla = z.input<typeof esquemaRegla>;
