/** Columnas de la plantilla de importación de animales (y del inventario exportado). */
import { ETIQUETA_ESPECIE, ETIQUETA_ESTADO_REPRODUCTIVO, ETIQUETA_SEXO } from "@/lib/etiquetas";

export type ListaColumna =
  | "especie"
  | "sexo"
  | "origen"
  | "siNo"
  | "estadoReproductivo"
  | "razas"
  | "lotes"
  | "potreros"
  | "toros";

export interface ColumnaImportacion {
  clave: string;
  encabezado: string;
  requerido?: boolean;
  ancho: number;
  ejemplo: string | number | Date;
  ayuda: string;
  lista?: ListaColumna;
  tipo?: "fecha" | "numero";
}

/** Valores aceptados (además se toleran mayúsculas/minúsculas y tildes). */
export const VALORES_ORIGEN = { Nacido: "NACIDO", Comprado: "COMPRADO" } as const;
export const VALORES_SI_NO = { Sí: true, No: false } as const;

export const LISTAS_FIJAS: Partial<Record<ListaColumna, string[]>> = {
  especie: Object.values(ETIQUETA_ESPECIE),
  sexo: Object.values(ETIQUETA_SEXO),
  origen: Object.keys(VALORES_ORIGEN),
  siNo: Object.keys(VALORES_SI_NO),
  estadoReproductivo: Object.values(ETIQUETA_ESTADO_REPRODUCTIVO),
};

export const COLUMNAS_IMPORTACION: ColumnaImportacion[] = [
  {
    clave: "numero",
    encabezado: "Número / chapeta",
    requerido: true,
    ancho: 16,
    ejemplo: "601",
    ayuda: "Único en la finca.",
  },
  { clave: "nombre", encabezado: "Nombre", ancho: 16, ejemplo: "Mariposa", ayuda: "Opcional." },
  {
    clave: "especie",
    encabezado: "Especie",
    ancho: 11,
    ejemplo: "Bovino",
    ayuda: "Bovino, Equino u Otra. Vacío = Bovino.",
    lista: "especie",
  },
  {
    clave: "sexo",
    encabezado: "Sexo",
    requerido: true,
    ancho: 10,
    ejemplo: "Hembra",
    ayuda: "Hembra o Macho.",
    lista: "sexo",
  },
  {
    clave: "raza",
    encabezado: "Raza",
    ancho: 22,
    ejemplo: "Holstein",
    ayuda: "Debe existir en Configuración › Razas.",
    lista: "razas",
  },
  {
    clave: "fechaNacimiento",
    encabezado: "Fecha de nacimiento",
    ancho: 14,
    ejemplo: new Date(Date.UTC(2021, 2, 10)),
    ayuda: "dd/mm/aaaa. Obligatoria si nació en la finca.",
    tipo: "fecha",
  },
  {
    clave: "fechaNacimientoEstimada",
    encabezado: "Nacimiento estimado",
    ancho: 12,
    ejemplo: "No",
    ayuda: "Sí si la fecha es aproximada.",
    lista: "siNo",
  },
  {
    clave: "origen",
    encabezado: "Origen",
    requerido: true,
    ancho: 12,
    ejemplo: "Comprado",
    ayuda: "Nacido (en la finca) o Comprado.",
    lista: "origen",
  },
  {
    clave: "fechaIngreso",
    encabezado: "Fecha de ingreso",
    ancho: 14,
    ejemplo: new Date(Date.UTC(2024, 4, 2)),
    ayuda: "dd/mm/aaaa. Si nació en la finca se usa la de nacimiento.",
    tipo: "fecha",
  },
  {
    clave: "pesoNacimientoKg",
    encabezado: "Peso al nacer (kg)",
    ancho: 12,
    ejemplo: "",
    ayuda: "Solo nacidos en la finca.",
    tipo: "numero",
  },
  {
    clave: "madre",
    encabezado: "Número de la madre",
    ancho: 14,
    ejemplo: "",
    ayuda: "Número de una hembra ya registrada o de otra fila de este archivo.",
  },
  {
    clave: "padre",
    encabezado: "Padre (toro)",
    ancho: 16,
    ejemplo: "Ébano",
    ayuda: "Nombre o código del toro registrado en Configuración › Toros.",
    lista: "toros",
  },
  {
    clave: "lote",
    encabezado: "Lote",
    ancho: 20,
    ejemplo: "Lote 1 · Producción",
    ayuda: "Debe existir en Configuración › Lotes.",
    lista: "lotes",
  },
  {
    clave: "potrero",
    encabezado: "Potrero",
    ancho: 16,
    ejemplo: "P1 El Alto",
    ayuda: "Debe existir en Configuración › Potreros.",
    lista: "potreros",
  },
  {
    clave: "estadoReproductivo",
    encabezado: "Estado reproductivo",
    ancho: 14,
    ejemplo: "Preñada",
    ayuda: "Solo hembras: Novilla, Vacía, Servida, Preñada, Seca o Parida.",
    lista: "estadoReproductivo",
  },
  {
    clave: "numeroPartos",
    encabezado: "Partos previos",
    ancho: 10,
    ejemplo: 2,
    ayuda: "Solo hembras. Vacío = 0.",
    tipo: "numero",
  },
  {
    clave: "enProduccion",
    encabezado: "En producción",
    ancho: 11,
    ejemplo: "Sí",
    ayuda: "Solo hembras: Sí si está en ordeño.",
    lista: "siNo",
  },
  {
    clave: "valorCompra",
    encabezado: "Valor de compra",
    ancho: 14,
    ejemplo: 4500000,
    ayuda: "Solo comprados. En pesos, sin puntos o con puntos de miles.",
    tipo: "numero",
  },
  {
    clave: "observaciones",
    encabezado: "Observaciones",
    ancho: 30,
    ejemplo: "",
    ayuda: "Opcional.",
  },
];

export const MAX_FILAS_IMPORTACION = 3000;
