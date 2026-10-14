/** Etiquetas en español de los enums del esquema (para la interfaz y los Excel). */
import type {
  DestinoConsumoLeche,
  EstadoAnimal,
  EstadoReproductivo,
  Especie,
  GrupoCosto,
  Jornada,
  MetodoDiagnostico,
  MetodoPesaje,
  OrigenAnimal,
  OrigenCompra,
  Periodicidad,
  PropositoLote,
  ResultadoDiagnostico,
  Sexo,
  TipoCategoriaGasto,
  TipoContrato,
  TipoEventoSanitario,
  TipoIngreso,
  TipoInsumo,
  TipoMovimientoAnimal,
  TipoParto,
  TipoServicio,
  UnidadMedida,
} from "@/generated/prisma/enums";

export const ETIQUETA_ESPECIE: Record<Especie, string> = {
  BOVINO: "Bovino",
  EQUINO: "Equino",
  OTRA: "Otra",
};

export const ETIQUETA_SEXO: Record<Sexo, string> = { HEMBRA: "Hembra", MACHO: "Macho" };

export const ETIQUETA_ORIGEN: Record<OrigenAnimal, string> = {
  NACIDO: "Nacido en la finca",
  COMPRADO: "Comprado",
};

export const ETIQUETA_ESTADO_ANIMAL: Record<EstadoAnimal, string> = {
  ACTIVO: "Activo",
  VENDIDO: "Vendido",
  MUERTO: "Muerto",
  DESCARTADO: "Descartado",
};

export const ETIQUETA_ESTADO_REPRODUCTIVO: Record<EstadoReproductivo, string> = {
  NOVILLA: "Novilla",
  VACIA: "Vacía",
  SERVIDA: "Servida",
  PRENADA: "Preñada",
  SECA: "Seca",
  PARIDA: "Parida",
};

export const ETIQUETA_TIPO_MOVIMIENTO: Record<TipoMovimientoAnimal, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  TRASLADO_LOTE: "Traslado de lote",
  TRASLADO_POTRERO: "Traslado de potrero",
  MUERTE: "Muerte",
  DESCARTE: "Descarte",
};

export const ETIQUETA_PROPOSITO_LOTE: Record<PropositoLote, string> = {
  LECHERIA: "Lechería",
  CEBA: "Ceba",
  CRIA: "Cría",
  LEVANTE: "Levante",
  OTRO: "Otro",
};

export const ETIQUETA_GRUPO_COSTO: Record<GrupoCosto, string> = {
  COSTO_FIJO: "Costo fijo",
  COSTO_VARIABLE: "Costo variable",
  GASTO_EMPRESARIAL: "Gasto empresarial",
};

export const ETIQUETA_TIPO_CATEGORIA_GASTO: Record<TipoCategoriaGasto, string> = {
  INSUMO: "Insumo",
  MANO_OBRA: "Mano de obra",
  INDIRECTO: "Indirecto",
  OTRO: "Otro",
};

export const ETIQUETA_TIPO_INSUMO: Record<TipoInsumo, string> = {
  ALIMENTO: "Alimento",
  SAL: "Sal",
  SUPLEMENTO: "Suplemento",
  MEDICAMENTO: "Medicamento",
  SEMEN: "Semen",
  FERTILIZANTE: "Fertilizante",
  COMBUSTIBLE: "Combustible",
  OTRO: "Otro",
};

export const ETIQUETA_UNIDAD: Record<UnidadMedida, string> = {
  KG: "Kilogramo (kg)",
  G: "Gramo (g)",
  L: "Litro (L)",
  ML: "Mililitro (ml)",
  BULTO: "Bulto",
  UNIDAD: "Unidad",
  DOSIS: "Dosis",
  GALON: "Galón",
};

export const ETIQUETA_ORIGEN_COMPRA: Record<OrigenCompra, string> = {
  COOPERATIVA: "Almacén de la cooperativa",
  EXTERNA: "Compra externa",
};

export const ETIQUETA_TIPO_CONTRATO: Record<TipoContrato, string> = {
  CON_PRESTACIONES: "Contrato con prestaciones",
  SIN_PRESTACIONES: "Contrato sin prestaciones",
};

export const ETIQUETA_PERIODICIDAD: Record<Periodicidad, string> = {
  MENSUAL: "Mensual",
  BIMESTRAL: "Bimestral",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export const ETIQUETA_TIPO_INGRESO: Record<TipoIngreso, string> = {
  VENTA_LECHE: "Venta de leche",
  VENTA_ANIMAL: "Venta de animal",
  OTRO: "Otro ingreso",
};

export const ETIQUETA_TIPO_SERVICIO: Record<TipoServicio, string> = {
  MONTA_NATURAL: "Monta natural",
  INSEMINACION: "Inseminación",
};

export const ETIQUETA_METODO_DIAGNOSTICO: Record<MetodoDiagnostico, string> = {
  PALPACION: "Palpación",
  ECOGRAFIA: "Ecografía",
};

export const ETIQUETA_RESULTADO_DIAGNOSTICO: Record<ResultadoDiagnostico, string> = {
  PRENADA: "Preñada",
  VACIA: "Vacía",
};

export const ETIQUETA_TIPO_PARTO: Record<TipoParto, string> = {
  NORMAL: "Normal",
  ASISTIDO: "Asistido",
};

export const ETIQUETA_JORNADA: Record<Jornada, string> = {
  MANANA: "Mañana",
  TARDE: "Tarde",
  DIA: "Día completo",
};

export const ETIQUETA_DESTINO_LECHE: Record<DestinoConsumoLeche, string> = {
  TRABAJADORES: "Trabajadores",
  TERNERAS: "Terneras",
  RETIRO: "Leche de retiro",
  ARRIENDO: "Arriendo",
};

export const ETIQUETA_METODO_PESAJE: Record<MetodoPesaje, string> = {
  BASCULA: "Báscula",
  CINTA: "Cinta",
};

export const ETIQUETA_TIPO_EVENTO_SANITARIO: Record<TipoEventoSanitario, string> = {
  VACUNA: "Vacuna",
  DESPARASITACION: "Desparasitación",
  TRATAMIENTO: "Tratamiento",
};

/** Convierte un mapa de etiquetas en opciones para un <select>. */
export function opciones<T extends string>(
  mapa: Record<T, string>,
): { valor: T; etiqueta: string }[] {
  return (Object.entries(mapa) as [T, string][]).map(([valor, etiqueta]) => ({ valor, etiqueta }));
}
