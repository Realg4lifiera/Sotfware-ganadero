/** Compras y gastos directos (Módulo 1). */
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { ETIQUETA_ORIGEN_COMPRA, opciones } from "@/lib/etiquetas";
import { calcularCompra } from "@/lib/dominio/compras";
import { hoy } from "@/lib/fechas";
import { parsearNumeroCO } from "@/lib/formato";

/** Campos del registro rápido (también los usa el mayordomo en el celular). */
export const CAMPOS_GASTO_BASICOS: DefCampo[] = [
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  {
    nombre: "descripcion",
    etiqueta: "Artículo o concepto",
    tipo: "texto",
    requerido: true,
    max: 200,
    anchoCompleto: true,
  },
  {
    nombre: "categoriaId",
    etiqueta: "Categoría",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "categorias",
  },
  {
    nombre: "centroCostoId",
    etiqueta: "Centro de costo",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "centros",
  },
  {
    nombre: "cantidad",
    etiqueta: "Cantidad",
    tipo: "decimal",
    requerido: true,
    min: 0.001,
    porDefecto: "1",
  },
  {
    nombre: "valorUnitario",
    etiqueta: "Valor unitario",
    tipo: "decimal",
    requerido: true,
    min: 0,
    sufijo: "COP",
  },
  { nombre: "proveedorId", etiqueta: "Proveedor", tipo: "opcion", opcionesDe: "proveedores" },
];

/** Detalle de la compra (formato Colanta) y asignación. */
export const CAMPOS_GASTO_DETALLE: DefCampo[] = [
  {
    nombre: "descuento",
    etiqueta: "Descuento total",
    tipo: "decimal",
    min: 0,
    sufijo: "COP",
    porDefecto: "0",
  },
  {
    nombre: "ivaPorcentaje",
    etiqueta: "IVA",
    tipo: "decimal",
    min: 0,
    max: 100,
    sufijo: "%",
    porDefecto: "0",
    ayuda: "Normalmente 0, 5 o 19 %.",
  },
  {
    nombre: "origen",
    etiqueta: "Origen de la compra",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_ORIGEN_COMPRA),
    porDefecto: "EXTERNA",
  },
  { nombre: "numeroFactura", etiqueta: "N.º de factura", tipo: "texto", max: 60 },
  { nombre: "insumoId", etiqueta: "Insumo del catálogo", tipo: "opcion", opcionesDe: "insumos" },
  {
    nombre: "presentacion",
    etiqueta: "Presentación",
    tipo: "texto",
    max: 80,
    ayuda: "Ej.: Bulto x 40 kg",
  },
  { nombre: "marca", etiqueta: "Marca", tipo: "texto", max: 80 },
  { nombre: "contenido", etiqueta: "Contenido o peso", tipo: "decimal", min: 0 },
  {
    nombre: "animalId",
    etiqueta: "Asignar a un animal",
    tipo: "opcion",
    opcionesDe: "animales",
    ayuda: "Opcional: gasto directo de un animal (p. ej. un tratamiento).",
  },
  {
    nombre: "loteId",
    etiqueta: "Asignar a un lote",
    tipo: "opcion",
    opcionesDe: "lotes",
    ayuda: "Opcional: gasto directo de un lote (p. ej. alimento del lote).",
  },
  { nombre: "notas", etiqueta: "Notas", tipo: "textarea", anchoCompleto: true },
];

export const CAMPOS_GASTO = [...CAMPOS_GASTO_BASICOS, ...CAMPOS_GASTO_DETALLE];

export const esquemaGasto = esquemaDesdeCampos(CAMPOS_GASTO).superRefine((d, ctx) => {
  const error = (campo: string, message: string) =>
    ctx.addIssue({ code: "custom", path: [campo], message });
  const fecha = d.fecha as Date | null;
  if (fecha && fecha > hoy()) error("fecha", "No puede ser una fecha futura.");
  if (d.animalId && d.loteId) error("loteId", "Asigna a un animal o a un lote, no a ambos.");
  const cantidad = Number(d.cantidad);
  const valorUnitario = Number(d.valorUnitario);
  const descuento = Number(d.descuento ?? 0);
  if (
    Number.isFinite(cantidad) &&
    Number.isFinite(valorUnitario) &&
    descuento > cantidad * valorUnitario
  )
    error("descuento", "El descuento no puede ser mayor que el valor de la compra.");
});

/** Totales a partir de los valores del formulario (texto) — para mostrar en vivo. */
export function totalesDesdeFormulario(v: Record<string, unknown>) {
  const n = (x: unknown) => parsearNumeroCO(String(x ?? "")) ?? 0;
  return calcularCompra({
    cantidad: n(v.cantidad),
    valorUnitario: n(v.valorUnitario),
    descuento: n(v.descuento),
    ivaPorcentaje: n(v.ivaPorcentaje),
  });
}
