/** Entregas de leche y consumo interno (Módulo 3, adelantados para el costo por litro). */
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { ETIQUETA_DESTINO_LECHE, opciones } from "@/lib/etiquetas";
import { hoy } from "@/lib/fechas";
import { z } from "zod";

const noFutura = (d: Record<string, unknown>, ctx: z.RefinementCtx) => {
  const f = d.fecha as Date | null;
  if (f && f > hoy())
    ctx.addIssue({ code: "custom", path: ["fecha"], message: "No puede ser una fecha futura." });
};

export const CAMPOS_ENTREGA: DefCampo[] = [
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  {
    nombre: "compradorId",
    etiqueta: "Comprador",
    tipo: "opcion",
    requerido: true,
    opcionesDe: "compradores",
  },
  {
    nombre: "litros",
    etiqueta: "Litros entregados",
    tipo: "decimal",
    requerido: true,
    min: 0.01,
    max: 100000,
    sufijo: "L",
  },
  {
    nombre: "precioLitro",
    etiqueta: "Precio por litro",
    tipo: "decimal",
    min: 0,
    sufijo: "COP",
    ayuda: "Opcional; el valor pagado se registra en Ingresos.",
  },
  { nombre: "nota", etiqueta: "Nota", tipo: "texto", max: 200, anchoCompleto: true },
];
export const esquemaEntrega = esquemaDesdeCampos(CAMPOS_ENTREGA).superRefine(noFutura);

const litros = (nombre: string, etiqueta: string): DefCampo => ({
  nombre,
  etiqueta,
  tipo: "decimal",
  min: 0,
  max: 100000,
  sufijo: "L",
  porDefecto: "0",
});

/** Formulario como el de Colanta: varios destinos de una vez. */
export const CAMPOS_CONSUMO_LOTE: DefCampo[] = [
  {
    nombre: "fecha",
    etiqueta: "Fecha",
    tipo: "fecha",
    requerido: true,
    ayuda: "Puede ser el total del mes.",
  },
  litros("TRABAJADORES", "Litros de trabajadores"),
  litros("TERNERAS", "Litros de terneras"),
  litros("RETIRO", "Litros de retiro"),
  litros("ARRIENDO", "Litros de arriendo"),
  {
    nombre: "valorArriendo",
    etiqueta: "Total de arriendo",
    tipo: "decimal",
    min: 0,
    sufijo: "COP",
    porDefecto: "0",
  },
  { nombre: "nota", etiqueta: "Nota", tipo: "texto", max: 200, anchoCompleto: true },
];
export const esquemaConsumoLote = esquemaDesdeCampos(CAMPOS_CONSUMO_LOTE).superRefine((d, ctx) => {
  noFutura(d, ctx);
  const total = ["TRABAJADORES", "TERNERAS", "RETIRO", "ARRIENDO"].reduce(
    (s, k) => s + Number(d[k] ?? 0),
    0,
  );
  if (total <= 0)
    ctx.addIssue({
      code: "custom",
      path: ["TRABAJADORES"],
      message: "Escribe los litros de al menos un destino.",
    });
  if (Number(d.valorArriendo ?? 0) > 0 && !(Number(d.ARRIENDO ?? 0) > 0))
    ctx.addIssue({
      code: "custom",
      path: ["ARRIENDO"],
      message: "Indica los litros entregados como arriendo.",
    });
});

/** Edición de un registro individual. */
export const CAMPOS_CONSUMO: DefCampo[] = [
  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
  {
    nombre: "destino",
    etiqueta: "Destino",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_DESTINO_LECHE),
  },
  { ...litros("litros", "Litros"), requerido: true, min: 0.01, porDefecto: undefined },
  {
    nombre: "valor",
    etiqueta: "Valor",
    tipo: "decimal",
    min: 0,
    sufijo: "COP",
    ayuda: "Solo para arriendo.",
  },
  { nombre: "nota", etiqueta: "Nota", tipo: "texto", max: 200, anchoCompleto: true },
];
export const esquemaConsumo = esquemaDesdeCampos(CAMPOS_CONSUMO).superRefine((d, ctx) => {
  noFutura(d, ctx);
  if (d.valor && d.destino !== "ARRIENDO")
    ctx.addIssue({
      code: "custom",
      path: ["valor"],
      message: "El valor solo aplica a la leche de arriendo.",
    });
});
