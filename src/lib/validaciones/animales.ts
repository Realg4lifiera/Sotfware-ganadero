/**
 * Ficha del animal: campos, validación (cliente y servidor) y movimientos.
 * Las reglas que necesitan la BD (madre hembra, padre existente…) están en
 * lib/servicios/animales.ts.
 */
import { z } from "zod";
import type { EstadoReproductivo, Especie, OrigenAnimal, Sexo } from "@/generated/prisma/enums";
import { esquemaDesdeCampos, type DefCampo } from "@/lib/formularios/campos";
import { hoy } from "@/lib/fechas";
import { parsearNumeroCO } from "@/lib/formato";
import {
  ETIQUETA_ESPECIE,
  ETIQUETA_ESTADO_REPRODUCTIVO,
  ETIQUETA_ORIGEN,
  ETIQUETA_SEXO,
  opciones,
} from "@/lib/etiquetas";

export const CAMPOS_ANIMAL: DefCampo[] = [
  { nombre: "numero", etiqueta: "Número / chapeta", tipo: "texto", requerido: true, max: 20 },
  { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", max: 60 },
  {
    nombre: "especie",
    etiqueta: "Especie",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_ESPECIE),
    porDefecto: "BOVINO",
  },
  {
    nombre: "sexo",
    etiqueta: "Sexo",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_SEXO),
  },
  { nombre: "razaId", etiqueta: "Raza", tipo: "opcion", opcionesDe: "razas" },
  { nombre: "fechaNacimiento", etiqueta: "Fecha de nacimiento", tipo: "fecha" },
  {
    nombre: "fechaNacimientoEstimada",
    etiqueta: "Fecha de nacimiento estimada",
    tipo: "booleano",
    ayuda: "Márcalo si no se conoce la fecha exacta.",
  },
  {
    nombre: "origen",
    etiqueta: "Origen",
    tipo: "opcion",
    requerido: true,
    opciones: opciones(ETIQUETA_ORIGEN),
    porDefecto: "NACIDO",
  },
  {
    nombre: "fechaIngreso",
    etiqueta: "Fecha de ingreso a la finca",
    tipo: "fecha",
    requerido: true,
  },
  {
    nombre: "pesoNacimientoKg",
    etiqueta: "Peso al nacer",
    tipo: "decimal",
    min: 1,
    max: 100,
    sufijo: "kg",
  },
  { nombre: "madreId", etiqueta: "Madre", tipo: "opcion", opcionesDe: "madres" },
  { nombre: "padreId", etiqueta: "Padre (toro)", tipo: "opcion", opcionesDe: "toros" },
  { nombre: "loteId", etiqueta: "Lote", tipo: "opcion", opcionesDe: "lotes" },
  { nombre: "potreroId", etiqueta: "Potrero", tipo: "opcion", opcionesDe: "potreros" },
  { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea", anchoCompleto: true },
];

/** Datos que solo se piden al crear (después los maneja el dominio). */
export const CAMPOS_ANIMAL_CREACION: DefCampo[] = [
  {
    nombre: "estadoReproductivo",
    etiqueta: "Estado reproductivo inicial",
    tipo: "opcion",
    opciones: opciones(ETIQUETA_ESTADO_REPRODUCTIVO),
    ayuda: "Después solo cambia con los eventos reproductivos.",
  },
  {
    nombre: "numeroPartos",
    etiqueta: "Partos previos",
    tipo: "entero",
    min: 0,
    max: 20,
    porDefecto: "0",
    ayuda: "Partos que tuvo antes de registrarla en el sistema.",
  },
  {
    nombre: "enProduccion",
    etiqueta: "En producción (en ordeño)",
    tipo: "booleano",
    ayuda: "Abre una lactancia desde la fecha de ingreso.",
  },
  { nombre: "valorCompra", etiqueta: "Valor de compra", tipo: "decimal", min: 0, sufijo: "COP" },
];

/** Datos de un animal nuevo ya validados (formulario o fila de Excel). */
export interface AnimalNuevo {
  numero: string;
  nombre: string | null;
  especie: Especie;
  sexo: Sexo;
  razaId: string | null;
  fechaNacimiento: Date | null;
  fechaNacimientoEstimada: boolean;
  origen: OrigenAnimal;
  fechaIngreso: Date;
  pesoNacimientoKg: string | null;
  madreId: string | null;
  padreId: string | null;
  loteId: string | null;
  potreroId: string | null;
  observaciones: string | null;
  estadoReproductivo: EstadoReproductivo | null;
  numeroPartos: number;
  enProduccion: boolean;
  valorCompra: string | null;
}

type Datos = Record<string, unknown>;

/** Reglas entre campos (las mismas en el navegador y en el servidor). */
function reglasAnimal(d: Datos, ctx: z.RefinementCtx, creacion: boolean) {
  const error = (campo: string, mensaje: string) =>
    ctx.addIssue({ code: "custom", path: [campo], message: mensaje });
  const hoyBogota = hoy();
  const nacimiento = d.fechaNacimiento as Date | null;
  const ingreso = d.fechaIngreso as Date | null;

  if (nacimiento && nacimiento > hoyBogota)
    error("fechaNacimiento", "No puede ser una fecha futura.");
  if (ingreso && ingreso > hoyBogota) error("fechaIngreso", "No puede ser una fecha futura.");
  if (nacimiento && ingreso && ingreso < nacimiento)
    error("fechaIngreso", "No puede ser anterior al nacimiento.");
  if (d.origen === "NACIDO" && !nacimiento)
    error("fechaNacimiento", "Indica la fecha de nacimiento (nació en la finca).");
  if (d.origen === "NACIDO" && nacimiento && ingreso && ingreso.getTime() !== nacimiento.getTime())
    error("fechaIngreso", "Si nació en la finca, ingresa el día que nació.");

  if (!creacion) return;
  const hembraBovina = d.sexo === "HEMBRA" && d.especie === "BOVINO";
  const partos = (d.numeroPartos as number | null) ?? 0;
  if (hembraBovina) {
    if (!d.estadoReproductivo) error("estadoReproductivo", "Indica el estado reproductivo.");
    if (d.estadoReproductivo === "NOVILLA" && partos > 0)
      error("estadoReproductivo", "Una novilla no tiene partos; elige otro estado.");
    // Por la máquina de estados, VACIA/SECA/PARIDA implican al menos un parto
    // (una novilla servida y vacía vuelve a NOVILLA).
    if (["VACIA", "SECA", "PARIDA"].includes(String(d.estadoReproductivo)) && partos === 0)
      error("numeroPartos", "Una vaca vacía, seca o parida ya tuvo al menos un parto.");
    if (d.enProduccion && partos === 0)
      error("numeroPartos", "Una vaca en producción tuvo al menos un parto.");
    if (d.enProduccion && d.estadoReproductivo === "SECA")
      error("enProduccion", "Una vaca seca no está en producción.");
  } else {
    if (d.estadoReproductivo) error("estadoReproductivo", "Solo aplica a hembras bovinas.");
    if (partos > 0) error("numeroPartos", "Solo aplica a hembras bovinas.");
    if (d.enProduccion) error("enProduccion", "Solo aplica a hembras bovinas.");
  }
  if (d.origen === "NACIDO" && d.valorCompra) error("valorCompra", "Solo para animales comprados.");
}

export const esquemaCrearAnimal = esquemaDesdeCampos([
  ...CAMPOS_ANIMAL,
  ...CAMPOS_ANIMAL_CREACION,
]).superRefine((d, ctx) => reglasAnimal(d, ctx, true));
export const esquemaEditarAnimal = esquemaDesdeCampos(
  CAMPOS_ANIMAL.filter((c) => c.nombre !== "loteId" && c.nombre !== "potreroId"),
).superRefine((d, ctx) => reglasAnimal(d, ctx, false));

// ── Movimientos ──────────────────────────────────────────────────────────────

export const TIPOS_MOVIMIENTO_REGISTRABLES = [
  "TRASLADO_LOTE",
  "TRASLADO_POTRERO",
  "VENTA",
  "MUERTE",
  "DESCARTE",
] as const;
export type TipoMovimientoRegistrable = (typeof TIPOS_MOVIMIENTO_REGISTRABLES)[number];

const texto = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : null));

const numero = (etiqueta: string, requerido: boolean) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || !v.trim()) {
        if (requerido) ctx.addIssue({ code: "custom", message: `${etiqueta} es obligatorio.` });
        return null;
      }
      const n = parsearNumeroCO(v);
      if (n === null || n < 0) {
        ctx.addIssue({ code: "custom", message: "Escribe un número válido." });
        return null;
      }
      return String(n);
    });

export const esquemaMovimiento = z
  .object({
    tipo: z.enum(TIPOS_MOVIMIENTO_REGISTRABLES, { message: "Selecciona el tipo de movimiento." }),
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Indica la fecha.")
      .transform((v) => new Date(`${v}T00:00:00Z`)),
    loteDestinoId: texto(40),
    potreroDestinoId: texto(40),
    compradorId: texto(40),
    valor: numero("El valor", false),
    pesoKg: numero("El peso", false),
    motivo: texto(300),
  })
  .superRefine((d, ctx) => {
    const error = (campo: string, mensaje: string) =>
      ctx.addIssue({ code: "custom", path: [campo], message: mensaje });
    if (Number.isNaN(d.fecha.getTime())) error("fecha", "Fecha no válida.");
    else if (d.fecha > hoy()) error("fecha", "No puede ser una fecha futura.");
    if (d.tipo === "TRASLADO_LOTE" && !d.loteDestinoId)
      error("loteDestinoId", "Elige el lote de destino.");
    if (d.tipo === "TRASLADO_POTRERO" && !d.potreroDestinoId)
      error("potreroDestinoId", "Elige el potrero de destino.");
    if (d.tipo === "VENTA" && !d.valor) error("valor", "Indica el valor de la venta.");
    if ((d.tipo === "MUERTE" || d.tipo === "DESCARTE") && !d.motivo)
      error("motivo", "Indica el motivo.");
  });
export type ValoresMovimiento = z.input<typeof esquemaMovimiento>;
