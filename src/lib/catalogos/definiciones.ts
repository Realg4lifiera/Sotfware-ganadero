/**
 * Catálogos de configuración. Cada uno se declara una vez y de aquí salen su validación,
 * su tabla, su formulario y sus acciones en el servidor (lib/catalogos/servidor.ts).
 */
import type { DefCampo } from "@/lib/formularios/campos";
import type { Permiso } from "@/lib/permisos";
import {
  ETIQUETA_GRUPO_COSTO,
  ETIQUETA_PROPOSITO_LOTE,
  ETIQUETA_TIPO_CATEGORIA_GASTO,
  ETIQUETA_TIPO_CONTRATO,
  ETIQUETA_TIPO_INSUMO,
  ETIQUETA_UNIDAD,
  opciones,
} from "@/lib/etiquetas";

export interface DefCatalogo {
  clave: string;
  titulo: string;
  singular: string;
  descripcion: string;
  permisos: Permiso[];
  campos: DefCampo[];
}

const activo: DefCampo = {
  nombre: "activo",
  etiqueta: "Activo",
  tipo: "booleano",
  porDefecto: true,
  ayuda: "Los inactivos no aparecen en las listas para registrar.",
};

const contacto: DefCampo[] = [
  { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
  { nombre: "nit", etiqueta: "NIT o cédula", tipo: "texto", max: 30, enLista: true },
  { nombre: "telefono", etiqueta: "Teléfono", tipo: "texto", max: 30, enLista: true },
  { nombre: "email", etiqueta: "Correo", tipo: "email" },
  { nombre: "direccion", etiqueta: "Dirección", tipo: "texto", anchoCompleto: true },
  activo,
];

const CONFIG: Permiso[] = ["configuracion:gestionar"];

export const CATALOGOS: DefCatalogo[] = [
  {
    clave: "potreros",
    titulo: "Potreros",
    singular: "potrero",
    descripcion: "Divisiones de la finca para el pastoreo y la rotación.",
    permisos: CONFIG,
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
      {
        nombre: "areaHa",
        etiqueta: "Área",
        tipo: "decimal",
        min: 0,
        max: 100000,
        sufijo: "ha",
        enLista: true,
      },
      { nombre: "tipoPasto", etiqueta: "Tipo de pasto", tipo: "texto", enLista: true },
      { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea", anchoCompleto: true },
      activo,
    ],
  },
  {
    clave: "lotes",
    titulo: "Lotes",
    singular: "lote",
    descripcion: "Grupos de manejo de los animales.",
    permisos: CONFIG,
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
      {
        nombre: "proposito",
        etiqueta: "Propósito",
        tipo: "opcion",
        requerido: true,
        opciones: opciones(ETIQUETA_PROPOSITO_LOTE),
        enLista: true,
      },
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea", anchoCompleto: true },
      activo,
    ],
  },
  {
    clave: "razas",
    titulo: "Razas",
    singular: "raza",
    descripcion: "Catálogo de razas y cruces.",
    permisos: CONFIG,
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
      activo,
    ],
  },
  {
    clave: "toros",
    titulo: "Toros",
    singular: "toro",
    descripcion: "Toros propios del hato y toros externos (pajillas). Son el padre de las crías.",
    permisos: ["configuracion:gestionar", "reproduccion:gestionar"],
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
      { nombre: "codigo", etiqueta: "Código o registro", tipo: "texto", max: 60, enLista: true },
      { nombre: "razaId", etiqueta: "Raza", tipo: "opcion", opcionesDe: "razas", enLista: true },
      {
        nombre: "propio",
        etiqueta: "Toro propio (del hato)",
        tipo: "booleano",
        enLista: true,
        ayuda: "Desmárcalo para toros externos usados con pajillas.",
      },
      {
        nombre: "animalId",
        etiqueta: "Animal del hato",
        tipo: "opcion",
        opcionesDe: "machos",
        ayuda: "Solo para toros propios: vincula su registro de animal.",
      },
      { nombre: "observaciones", etiqueta: "Observaciones", tipo: "textarea", anchoCompleto: true },
      activo,
    ],
  },
  {
    clave: "centros-costo",
    titulo: "Centros de costo",
    singular: "centro de costo",
    descripcion: "A dónde se cargan los costos: lechería, cría y levante, ceba, pasturas…",
    permisos: CONFIG,
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
      {
        nombre: "descripcion",
        etiqueta: "Descripción",
        tipo: "textarea",
        anchoCompleto: true,
        enLista: true,
      },
      activo,
    ],
  },
  {
    clave: "rubros",
    titulo: "Rubros de costo",
    singular: "rubro",
    descripcion:
      "Rubros del informe de costos (como el Excel de Colanta): costos fijos, variables y gastos empresariales.",
    permisos: CONFIG,
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
      {
        nombre: "grupo",
        etiqueta: "Grupo",
        tipo: "opcion",
        requerido: true,
        opciones: opciones(ETIQUETA_GRUPO_COSTO),
        enLista: true,
      },
      {
        nombre: "orden",
        etiqueta: "Orden en el informe",
        tipo: "entero",
        min: 0,
        max: 999,
        enLista: true,
      },
      activo,
    ],
  },
  {
    clave: "categorias-gasto",
    titulo: "Categorías de gasto",
    singular: "categoría de gasto",
    descripcion: "Clasificación de compras y gastos; cada categoría suma a un rubro del informe.",
    permisos: CONFIG,
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
      {
        nombre: "tipo",
        etiqueta: "Tipo",
        tipo: "opcion",
        requerido: true,
        opciones: opciones(ETIQUETA_TIPO_CATEGORIA_GASTO),
        enLista: true,
      },
      {
        nombre: "rubroId",
        etiqueta: "Rubro",
        tipo: "opcion",
        requerido: true,
        opcionesDe: "rubros",
        enLista: true,
      },
      activo,
    ],
  },
  {
    clave: "insumos",
    titulo: "Insumos",
    singular: "insumo",
    descripcion: "Alimentos, sales, medicamentos, semen, fertilizantes, combustibles…",
    permisos: CONFIG,
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
      {
        nombre: "tipo",
        etiqueta: "Tipo",
        tipo: "opcion",
        requerido: true,
        opciones: opciones(ETIQUETA_TIPO_INSUMO),
        enLista: true,
      },
      {
        nombre: "unidad",
        etiqueta: "Unidad de medida",
        tipo: "opcion",
        requerido: true,
        opciones: opciones(ETIQUETA_UNIDAD),
        enLista: true,
      },
      {
        nombre: "presentacion",
        etiqueta: "Presentación",
        tipo: "texto",
        enLista: true,
        ayuda: "Ej.: Bulto x 40 kg",
      },
      activo,
    ],
  },
  {
    clave: "proveedores",
    titulo: "Proveedores",
    singular: "proveedor",
    descripcion: "Proveedores de insumos y servicios.",
    permisos: CONFIG,
    campos: contacto,
  },
  {
    clave: "compradores",
    titulo: "Compradores",
    singular: "comprador",
    descripcion: "Compradores de leche y de ganado.",
    permisos: CONFIG,
    campos: contacto,
  },
  {
    clave: "trabajadores",
    titulo: "Trabajadores",
    singular: "trabajador",
    descripcion: "Trabajadores fijos y eventuales (reemplazos, jornales extras) para la nómina.",
    permisos: CONFIG,
    campos: [
      { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true, enLista: true },
      { nombre: "documento", etiqueta: "Documento", tipo: "texto", max: 30 },
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "texto", max: 30 },
      { nombre: "cargo", etiqueta: "Cargo o labor", tipo: "texto", enLista: true },
      {
        nombre: "tipoContrato",
        etiqueta: "Tipo de contrato",
        tipo: "opcion",
        requerido: true,
        opciones: opciones(ETIQUETA_TIPO_CONTRATO),
        enLista: true,
      },
      {
        nombre: "salarioBase",
        etiqueta: "Salario base",
        tipo: "decimal",
        min: 0,
        sufijo: "COP",
        enLista: true,
      },
      {
        nombre: "eventual",
        etiqueta: "Eventual (reemplazo o jornales)",
        tipo: "booleano",
        enLista: true,
      },
      { nombre: "fechaIngreso", etiqueta: "Fecha de ingreso", tipo: "fecha" },
      { nombre: "fechaRetiro", etiqueta: "Fecha de retiro", tipo: "fecha" },
      activo,
    ],
  },
];

export function catalogoPorClave(clave: string): DefCatalogo | undefined {
  return CATALOGOS.find((c) => c.clave === clave);
}
