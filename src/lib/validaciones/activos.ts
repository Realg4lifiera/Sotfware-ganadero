/** Activos (maquinaria y equipos) para la depreciación. */
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";

export const CAMPOS_ACTIVO: DefCampo[] = [
  { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, max: 120 },
  { nombre: "fechaCompra", etiqueta: "Fecha de compra", tipo: "fecha", requerido: true },
  {
    nombre: "valorCompra",
    etiqueta: "Valor de compra",
    tipo: "decimal",
    requerido: true,
    min: 0,
    sufijo: "COP",
  },
  {
    nombre: "vidaUtilMeses",
    etiqueta: "Vida útil",
    tipo: "entero",
    requerido: true,
    min: 1,
    max: 600,
    sufijo: "meses",
    ayuda: "Ej.: 120 meses = 10 años.",
  },
  {
    nombre: "valorResidual",
    etiqueta: "Valor residual",
    tipo: "decimal",
    min: 0,
    sufijo: "COP",
    porDefecto: "0",
    ayuda: "Lo que valdrá al final de su vida útil.",
  },
  {
    nombre: "centroCostoId",
    etiqueta: "Centro de costo",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "centros",
  },
  { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", anchoCompleto: true },
  {
    nombre: "activo",
    etiqueta: "En uso",
    tipo: "booleano",
    porDefecto: true,
    ayuda: "Desmárcalo si se vendió o se dio de baja: deja de depreciarse.",
  },
];

export const esquemaActivo = esquemaDesdeCampos(CAMPOS_ACTIVO).superRefine((d, ctx) => {
  if (Number(d.valorResidual ?? 0) > Number(d.valorCompra ?? 0))
    ctx.addIssue({
      code: "custom",
      path: ["valorResidual"],
      message: "No puede ser mayor que el valor de compra.",
    });
});
