/** Ingresos (Módulo 1): venta de leche y otros. La venta de animales se genera sola. */
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { hoy } from "@/lib/fechas";

export const CAMPOS_INGRESO: DefCampo[] = [
  {
    nombre: "tipo",
    etiqueta: "Tipo",
    tipo: "opcion",
    requerido: true,
    opciones: [
      { valor: "VENTA_LECHE", etiqueta: "Venta de leche" },
      { valor: "OTRO", etiqueta: "Otro ingreso" },
    ],
    porDefecto: "VENTA_LECHE",
  },
  {
    nombre: "concepto",
    etiqueta: "Concepto",
    tipo: "texto",
    requerido: true,
    max: 120,
    ayuda: "Ej.: Leche 1.ª quincena, Terneros, Animales de descarte.",
  },
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  { nombre: "compradorId", etiqueta: "Comprador", tipo: "opcion", opcionesDe: "compradores" },
  {
    nombre: "cantidad",
    etiqueta: "Cantidad",
    tipo: "decimal",
    requerido: true,
    min: 0.001,
    porDefecto: "1",
    ayuda: "En venta de leche: litros.",
  },
  {
    nombre: "precioUnitario",
    etiqueta: "Valor unitario",
    tipo: "decimal",
    requerido: true,
    min: 0,
    sufijo: "COP",
    ayuda: "En venta de leche: precio por litro.",
  },
  { nombre: "centroCostoId", etiqueta: "Centro de costo", tipo: "opcion", opcionesDe: "centros" },
  { nombre: "nota", etiqueta: "Nota", tipo: "textarea", anchoCompleto: true },
];

export const esquemaIngreso = esquemaDesdeCampos(CAMPOS_INGRESO).superRefine((d, ctx) => {
  const fecha = d.fecha as Date | null;
  if (fecha && fecha > hoy())
    ctx.addIssue({ code: "custom", path: ["fecha"], message: "No puede ser una fecha futura." });
});

/** Total = cantidad × valor unitario, redondeado a centavos. */
export function totalIngreso(cantidad: number, precioUnitario: number): number {
  return Math.round((cantidad * precioUnitario + Number.EPSILON) * 100) / 100;
}
