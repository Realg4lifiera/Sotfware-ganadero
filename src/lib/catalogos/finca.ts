/** Formulario de la finca: datos generales + parámetros del hato (en `configuracion`). */
import type { DefCampo } from "@/lib/formularios/campos";
import { CATEGORIAS, ETIQUETA_CATEGORIA, CATEGORIAS_HATO } from "@/lib/dominio/categoria";

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

const dias = (
  nombre: string,
  etiqueta: string,
  min: number,
  max: number,
  ayuda: string,
): DefCampo => ({
  nombre,
  etiqueta,
  tipo: "entero",
  requerido: true,
  min,
  max,
  sufijo: "días",
  ayuda,
});

/** Parámetros reproductivos (en `configuracion.reproduccion`). */
export const CAMPOS_REPRODUCCION: DefCampo[] = [
  dias("diasGestacion", "Días de gestación", 250, 310, "Para calcular la fecha probable de parto."),
  dias("diasSecadoAntesParto", "Secar antes del parto", 20, 120, "Alerta «vacas por secar»."),
  dias(
    "diasDiagnostico",
    "Diagnóstico tras el servicio",
    20,
    120,
    "Desde cuándo se puede diagnosticar la preñez.",
  ),
  dias("diasCiclo", "Ciclo estral", 15, 30, "Celo esperado si el servicio no preñó."),
  dias(
    "diasAbiertosMax",
    "Días abiertos máximos",
    30,
    400,
    "Vacas vacías con más días desde el parto son alerta.",
  ),
  dias(
    "diasAlertaParto",
    "Aviso de parto próximo",
    1,
    120,
    "Con cuánta anticipación se alerta un parto.",
  ),
];

/** Carga animal en UGG (en `configuracion.cargaAnimal`). */
export const CAMPOS_CARGA: DefCampo[] = [
  {
    nombre: "kgUgg",
    etiqueta: "Peso de una UGG",
    tipo: "decimal",
    requerido: true,
    min: 300,
    max: 600,
    sufijo: "kg",
    ayuda: "Unidad gran ganado: peso vivo que equivale a 1 UGG (referencia: 450 kg).",
  },
  ...CATEGORIAS.map(
    (c): DefCampo => ({
      nombre: `peso_${c}`,
      etiqueta: `Peso estimado · ${ETIQUETA_CATEGORIA[c]}`,
      tipo: "decimal",
      requerido: true,
      min: 1,
      max: 1500,
      sufijo: "kg",
    }),
  ),
];

/** Parámetros productivos (en `configuracion.produccion`). */
export const CAMPOS_PRODUCCION: DefCampo[] = [
  dias(
    "diasControlLechero",
    "Control lechero cada",
    1,
    60,
    "Aviso si una vaca en producción lleva más días sin control.",
  ),
  ...CATEGORIAS.map(
    (c): DefCampo => ({
      nombre: `pesaje_${c}`,
      etiqueta: `Pesar · ${ETIQUETA_CATEGORIA[c]}`,
      tipo: "entero",
      requerido: true,
      min: 0,
      max: 365,
      sufijo: "días",
      ayuda: "0 = no se pesa.",
    }),
  ),
];
