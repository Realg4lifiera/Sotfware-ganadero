/** Formulario de la finca: datos generales + parámetros del hato (en `configuracion`). */
import type { DefCampo } from "@/lib/formularios/campos";
import { ETIQUETA_CATEGORIA, CATEGORIAS_HATO } from "@/lib/dominio/categoria";

export const TIPOS_ORDENO = [
  "Manual",
  "Mecánico en potrero",
  "Mecánico sala baja automatización",
  "Mecánico sala alta automatización",
];

export const CAMPOS_FINCA: DefCampo[] = [
  { nombre: "nombre", etiqueta: "Nombre de la finca", tipo: "texto", requerido: true },
  {
    nombre: "codigo",
    etiqueta: "Código de proveedor",
    tipo: "texto",
    max: 40,
    ayuda: "Ej.: código en la cooperativa",
  },
  { nombre: "propietario", etiqueta: "Propietario", tipo: "texto" },
  { nombre: "nit", etiqueta: "NIT o cédula", tipo: "texto", max: 30 },
  { nombre: "telefono", etiqueta: "Teléfono", tipo: "texto", max: 30 },
  { nombre: "departamento", etiqueta: "Departamento", tipo: "texto" },
  { nombre: "municipio", etiqueta: "Municipio", tipo: "texto" },
  { nombre: "vereda", etiqueta: "Vereda", tipo: "texto" },
  { nombre: "areaTotalHa", etiqueta: "Área total", tipo: "decimal", min: 0, sufijo: "ha" },
  { nombre: "areaUtilHa", etiqueta: "Área útil (pastoreo)", tipo: "decimal", min: 0, sufijo: "ha" },
  {
    nombre: "tipoOrdeno",
    etiqueta: "Tipo de ordeño",
    tipo: "opcion",
    opciones: TIPOS_ORDENO.map((t) => ({ valor: t, etiqueta: t })),
  },
];

export const CAMPOS_HATO: DefCampo[] = [
  {
    nombre: "edadDesteteMeses",
    etiqueta: "Edad de destete",
    tipo: "entero",
    requerido: true,
    min: 1,
    max: 24,
    sufijo: "meses",
    ayuda: "Hembras menores a esta edad son «ternera lactante».",
  },
  {
    nombre: "edadNovillaMeses",
    etiqueta: "Edad de novilla",
    tipo: "entero",
    requerido: true,
    min: 1,
    max: 36,
    sufijo: "meses",
    ayuda: "Hembras sin partos desde esta edad son «novilla».",
  },
  ...CATEGORIAS_HATO.map((c): DefCampo => ({
    nombre: `ideal_${c}`,
    etiqueta: `% ideal · ${ETIQUETA_CATEGORIA[c]}`,
    tipo: "decimal",
    requerido: true,
    min: 0,
    max: 100,
    sufijo: "%",
  })),
];

export const CAMPOS_COSTOS: DefCampo[] = [
  {
    nombre: "ivaEsCosto",
    etiqueta: "El IVA de las compras suma al costo",
    tipo: "booleano",
    ayuda: "Márcalo si la finca no recupera el IVA (no es responsable de IVA).",
  },
];
