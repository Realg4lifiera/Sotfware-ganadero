import "server-only";
import { prismaBase } from "@/lib/db";
import { normalizar, type CatalogosImportacion } from "./validar-animales";

export async function cargarCatalogosImportacion(): Promise<CatalogosImportacion> {
  const [razas, lotes, potreros, toros, animales] = await Promise.all([
    prismaBase.raza.findMany({ where: { deletedAt: null } }),
    prismaBase.lote.findMany({ where: { deletedAt: null } }),
    prismaBase.potrero.findMany({ where: { deletedAt: null } }),
    prismaBase.toro.findMany({ where: { deletedAt: null } }),
    // Los eliminados no cuentan: al eliminar se libera (renombra) su número.
    prismaBase.animal.findMany({
      where: { deletedAt: null },
      select: { id: true, numero: true, sexo: true, especie: true, fechaNacimiento: true },
    }),
  ]);
  const mapa = (xs: { id: string; nombre: string }[]) =>
    new Map(xs.map((x) => [normalizar(x.nombre), x.id]));
  const mapaToros = new Map<string, string | null>();
  for (const t of toros) {
    for (const clave of [t.nombre, t.codigo].filter(Boolean).map(normalizar)) {
      // Un nombre repetido entre toros distintos queda ambiguo (null).
      mapaToros.set(clave, mapaToros.has(clave) && mapaToros.get(clave) !== t.id ? null : t.id);
    }
  }
  return {
    razas: mapa(razas),
    lotes: mapa(lotes),
    potreros: mapa(potreros),
    toros: mapaToros,
    animales: new Map(
      animales.map((a) => [
        a.numero,
        { id: a.id, sexo: a.sexo, especie: a.especie, fechaNacimiento: a.fechaNacimiento },
      ]),
    ),
  };
}
