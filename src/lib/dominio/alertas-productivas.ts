/**
 * Avisos productivos (función pura). Los días vienen de `configuracion.produccion`
 * (aprobado con el veterinario: control lechero cada 8 días; pesar terneras, levante y
 * ceba cada 30 días; las vacas en producción no se pesan).
 */
import {
  ETIQUETA_CATEGORIA,
  type CategoriaAnimal,
  type ConfiguracionProduccion,
} from "./categoria";

const DIA = 86_400_000;
const dias = (desde: Date, hasta: Date) => Math.round((hasta.getTime() - desde.getTime()) / DIA);
const plural = (n: number, s: string) => `${n} ${s}${n === 1 ? "" : "s"}`;

export type TipoAvisoProductivo = "PESAJE_PENDIENTE" | "CONTROL_LECHERO";

export const TITULO_AVISO_PRODUCTIVO: Record<TipoAvisoProductivo, string> = {
  PESAJE_PENDIENTE: "Pesajes pendientes",
  CONTROL_LECHERO: "Control lechero pendiente",
};

export interface SituacionProductiva {
  id: string;
  numero: string;
  nombre: string | null;
  categoria: CategoriaAnimal;
  lote: string | null;
  fechaIngreso: Date;
  ultimoPesaje: Date | null;
  /** Inicio de la lactancia abierta (solo vacas en producción). */
  inicioLactancia: Date | null;
  /** Último control lechero de la vaca (por vaca o por su lote). */
  ultimoControl: Date | null;
}

export interface AvisoProductivo {
  tipo: TipoAvisoProductivo;
  animalId: string;
  animal: string;
  detalle: string;
  /** Días desde el último registro (o desde el ingreso / el parto si no hay). */
  dias: number;
}

export function avisosProductivos(
  animales: SituacionProductiva[],
  c: ConfiguracionProduccion,
  referencia: Date,
): AvisoProductivo[] {
  const avisos: AvisoProductivo[] = [];
  for (const a of animales) {
    const animal = a.nombre ? `${a.numero} · ${a.nombre}` : a.numero;
    const enLote = a.lote ? ` · ${a.lote}` : "";

    const cadaPesaje = c.diasPesaje[a.categoria];
    if (cadaPesaje > 0) {
      const desde = a.ultimoPesaje ?? a.fechaIngreso;
      const d = dias(desde, referencia);
      if (d >= cadaPesaje)
        avisos.push({
          tipo: "PESAJE_PENDIENTE",
          animalId: a.id,
          animal,
          dias: d,
          detalle: `${ETIQUETA_CATEGORIA[a.categoria]}${enLote} · ${
            a.ultimoPesaje
              ? `último pesaje hace ${plural(d, "día")}`
              : `sin pesajes (ingresó hace ${plural(d, "día")})`
          }`,
        });
    }

    if (a.categoria === "VACA_PRODUCCION" && a.inicioLactancia) {
      const control =
        a.ultimoControl && a.ultimoControl >= a.inicioLactancia ? a.ultimoControl : null;
      const d = dias(control ?? a.inicioLactancia, referencia);
      if (d >= c.diasControlLechero)
        avisos.push({
          tipo: "CONTROL_LECHERO",
          animalId: a.id,
          animal,
          dias: d,
          detalle: control
            ? `Último control hace ${plural(d, "día")}${enLote}`
            : `Sin control en esta lactancia (parió hace ${plural(d, "día")})${enLote}`,
        });
    }
  }
  return avisos.sort((x, y) => y.dias - x.dias);
}
