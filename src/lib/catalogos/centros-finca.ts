/**
 * Centros de costo base de cada finca. Los usan el seed, la carga inicial de producción y
 * la creación de fincas desde la app.
 */

export const CENTROS_COSTO = [
  ["Lechería", "Vacas en producción y secas"],
  ["Cría y levante", "Terneras, novillas y machos de levante"],
  ["Ceba", "Machos de ceba"],
  ["Pasturas", "Fertilización, renovación y mantenimiento de potreros"],
  ["Administración", "Gastos generales de la finca"],
] as const;

/** Centros que el sistema reconoce (ver CentroCosto.clave). */
const CLAVES_CENTRO: Record<string, string> = {
  Lechería: "LECHERIA",
  "Cría y levante": "CRIA_LEVANTE",
  Ceba: "CEBA",
};

/** Cliente mínimo para crear los centros de costo (PrismaClient, tx auditado, etc.). */
export interface ClienteCentros {
  centroCosto: {
    create(args: {
      data: { nombre: string; descripcion: string; clave: string | null };
    }): PromiseLike<{ id: string; nombre: string }>;
  };
}

/**
 * Centros de costo de una finca nueva. Se crean uno a uno (la auditoría no admite
 * createMany) y dentro del contexto de la finca (lib/finca.ts pone el fincaId).
 */
export async function crearCentrosFinca(prisma: ClienteCentros): Promise<Map<string, string>> {
  const centros = new Map<string, string>();
  for (const [nombre, descripcion] of CENTROS_COSTO) {
    const c = await prisma.centroCosto.create({
      data: { nombre, descripcion, clave: CLAVES_CENTRO[nombre] ?? null },
    });
    centros.set(c.nombre, c.id);
  }
  return centros;
}
