/**
 * Categoría del animal en el inventario (estilo "Composición del hato" de Colanta).
 *
 * La categoría NO se guarda: se calcula con estas reglas, cuyas edades y porcentajes
 * ideales son configurables y viven en `Finca.configuracion`.
 */
import { z } from "zod";
import { mesesEntre } from "@/lib/fechas";

export const CATEGORIAS = [
  "VACA_PRODUCCION",
  "VACA_SECA",
  "NOVILLA",
  "TERNERA",
  "TERNERA_LACTANTE",
  "MACHO_LEVANTE_CEBA",
  "TORO",
  "OTRA_ESPECIE",
] as const;
export type CategoriaAnimal = (typeof CATEGORIAS)[number];

export const ETIQUETA_CATEGORIA: Record<CategoriaAnimal, string> = {
  VACA_PRODUCCION: "Vaca en producción",
  VACA_SECA: "Vaca seca",
  NOVILLA: "Novilla",
  TERNERA: "Ternera",
  TERNERA_LACTANTE: "Ternera lactante",
  MACHO_LEVANTE_CEBA: "Macho levante / ceba",
  TORO: "Toro",
  OTRA_ESPECIE: "Otra especie",
};

/** Categorías del "Inventario bovino" (hato lechero) con % ideal. */
export const CATEGORIAS_HATO: CategoriaAnimal[] = [
  "VACA_PRODUCCION",
  "VACA_SECA",
  "NOVILLA",
  "TERNERA",
  "TERNERA_LACTANTE",
];
/** "Ganado de carne y otras especies". */
export const CATEGORIAS_OTRAS: CategoriaAnimal[] = ["MACHO_LEVANTE_CEBA", "TORO", "OTRA_ESPECIE"];

export const configuracionHatoSchema = z.object({
  /** Hembras menores a esta edad son "ternera lactante". */
  edadDesteteMeses: z.number().int().min(1).max(24).default(8),
  /** Hembras sin partos desde esta edad son "novilla". */
  edadNovillaMeses: z.number().int().min(1).max(36).default(12),
  /** % ideal de cada categoría del hato (0–100). Referente Colanta: tasa de descarte 20 %. */
  porcentajeIdeal: z
    .object({
      VACA_PRODUCCION: z.number().min(0).max(100).default(50),
      VACA_SECA: z.number().min(0).max(100).default(15),
      NOVILLA: z.number().min(0).max(100).default(20),
      TERNERA: z.number().min(0).max(100).default(15),
      TERNERA_LACTANTE: z.number().min(0).max(100).default(0),
    })
    .prefault({}),
});
export type ConfiguracionHato = z.infer<typeof configuracionHatoSchema>;

export const configuracionFincaSchema = z.object({
  hato: configuracionHatoSchema.prefault({}),
});
export type ConfiguracionFinca = z.infer<typeof configuracionFincaSchema>;

/** Lee `Finca.configuracion` (JSON) completando valores por defecto. */
export function leerConfiguracion(json: unknown): ConfiguracionFinca {
  const r = configuracionFincaSchema.safeParse(json ?? {});
  return r.success ? r.data : configuracionFincaSchema.parse({});
}

export interface DatosCategoria {
  especie: "BOVINO" | "EQUINO" | "OTRA";
  sexo: "HEMBRA" | "MACHO";
  fechaNacimiento: Date | null;
  numeroPartos: number;
  /** Tiene una lactancia sin fecha de fin. */
  lactanciaAbierta: boolean;
  /** Está registrado como Toro (reproductor del hato). */
  esToro: boolean;
}

export function calcularCategoria(
  a: DatosCategoria,
  referencia: Date,
  config: ConfiguracionHato = configuracionHatoSchema.parse({}),
): CategoriaAnimal {
  if (a.especie !== "BOVINO") return "OTRA_ESPECIE";
  if (a.sexo === "MACHO") return a.esToro ? "TORO" : "MACHO_LEVANTE_CEBA";

  if (a.lactanciaAbierta) return "VACA_PRODUCCION";
  if (a.numeroPartos > 0) return "VACA_SECA";
  if (!a.fechaNacimiento) return "NOVILLA";

  const meses = mesesEntre(a.fechaNacimiento, referencia);
  if (meses < config.edadDesteteMeses) return "TERNERA_LACTANTE";
  if (meses < config.edadNovillaMeses) return "TERNERA";
  return "NOVILLA";
}

export interface FilaComposicion {
  categoria: CategoriaAnimal;
  etiqueta: string;
  cantidad: number;
  /** Fracción del total del grupo (0–1). */
  porcentajeReal: number;
  /** Fracción ideal (0–1), solo para categorías del hato. */
  porcentajeIdeal: number | null;
}

/** Tabla de composición del hato (real vs ideal), como el informe de Colanta. */
export function composicionHato(
  categorias: CategoriaAnimal[],
  config: ConfiguracionHato = configuracionHatoSchema.parse({}),
): { hato: FilaComposicion[]; otras: FilaComposicion[]; totalHato: number; totalOtras: number } {
  const conteo = new Map<CategoriaAnimal, number>();
  for (const c of categorias) conteo.set(c, (conteo.get(c) ?? 0) + 1);

  const totalHato = CATEGORIAS_HATO.reduce((s, c) => s + (conteo.get(c) ?? 0), 0);
  const totalOtras = CATEGORIAS_OTRAS.reduce((s, c) => s + (conteo.get(c) ?? 0), 0);

  const hato = CATEGORIAS_HATO.map((c) => ({
    categoria: c,
    etiqueta: ETIQUETA_CATEGORIA[c],
    cantidad: conteo.get(c) ?? 0,
    porcentajeReal: totalHato ? (conteo.get(c) ?? 0) / totalHato : 0,
    porcentajeIdeal: config.porcentajeIdeal[c as keyof ConfiguracionHato["porcentajeIdeal"]] / 100,
  }));
  const otras = CATEGORIAS_OTRAS.map((c) => ({
    categoria: c,
    etiqueta: ETIQUETA_CATEGORIA[c],
    cantidad: conteo.get(c) ?? 0,
    porcentajeReal: totalOtras ? (conteo.get(c) ?? 0) / totalOtras : 0,
    porcentajeIdeal: null,
  }));
  return { hato, otras, totalHato, totalOtras };
}
