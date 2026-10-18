/** Pajillas de semen (inventario del termo). El costo entra por Compras, no aquí. */
import { z } from "zod";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { hoy } from "@/lib/fechas";

export const CAMPOS_PAJILLA: DefCampo[] = [
  { nombre: "toroId", etiqueta: "Toro", tipo: "opcion", requerido: true, opcionesDe: "toros" },
  { nombre: "razaId", etiqueta: "Raza", tipo: "opcion", opcionesDe: "razas" },
  { nombre: "codigo", etiqueta: "Código o lote", tipo: "texto", max: 60 },
  {
    nombre: "ubicacionTermo",
    etiqueta: "Ubicación en el termo",
    tipo: "texto",
    max: 60,
    ayuda: "Ej.: termo 1, canastilla 3",
  },
  { nombre: "proveedorId", etiqueta: "Proveedor", tipo: "opcion", opcionesDe: "proveedores" },
  {
    nombre: "valorUnitario",
    etiqueta: "Valor de referencia por pajilla",
    tipo: "decimal",
    min: 0,
    sufijo: "COP",
    ayuda: "Solo informativo: el costo se registra en Compras.",
  },
  {
    nombre: "activo",
    etiqueta: "Activa",
    tipo: "booleano",
    porDefecto: true,
    ayuda: "Desmárcala para ocultarla al registrar servicios.",
  },
];

export const CAMPO_EXISTENCIAS_INICIALES: DefCampo = {
  nombre: "existenciasIniciales",
  etiqueta: "Pajillas que entran al termo",
  tipo: "entero",
  requerido: true,
  min: 0,
  max: 10000,
  porDefecto: "0",
};

export const esquemaPajilla = esquemaDesdeCampos(CAMPOS_PAJILLA);
export const esquemaPajillaNueva = esquemaDesdeCampos([
  ...CAMPOS_PAJILLA,
  CAMPO_EXISTENCIAS_INICIALES,
]);

export const CAMPOS_MOVIMIENTO_PAJILLA: DefCampo[] = [
  {
    nombre: "tipo",
    etiqueta: "Movimiento",
    tipo: "opcion",
    requerido: true,
    opciones: [
      { valor: "ENTRADA", etiqueta: "Entrada (compra o donación)" },
      { valor: "AJUSTE", etiqueta: "Ajuste de inventario" },
    ],
  },
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  {
    nombre: "cantidad",
    etiqueta: "Cantidad",
    tipo: "entero",
    requerido: true,
    min: -10000,
    max: 10000,
    ayuda: "En un ajuste, negativa si faltan pajillas (p. ej. -2).",
  },
  { nombre: "nota", etiqueta: "Nota", tipo: "texto", max: 200, anchoCompleto: true },
];

export const esquemaMovimientoPajilla = esquemaDesdeCampos(CAMPOS_MOVIMIENTO_PAJILLA).superRefine(
  (d, ctx) => {
    const n = Number(d.cantidad);
    if (n === 0)
      ctx.addIssue({ code: "custom", path: ["cantidad"], message: "No puede ser cero." });
    if (d.tipo === "ENTRADA" && n < 0)
      ctx.addIssue({ code: "custom", path: ["cantidad"], message: "Una entrada es positiva." });
    if ((d.fecha as Date | null) && (d.fecha as Date) > hoy())
      ctx.addIssue({ code: "custom", path: ["fecha"], message: "No puede ser una fecha futura." });
  },
) as z.ZodType;
