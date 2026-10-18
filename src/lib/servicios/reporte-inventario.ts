import "server-only";
import { prismaBase } from "@/lib/db";
import {
  CATEGORIAS,
  composicionHato,
  ETIQUETA_CATEGORIA,
  type CategoriaAnimal,
} from "@/lib/dominio/categoria";
import { rotacionInventario, type TipoSalida } from "@/lib/dominio/rotacion-inventario";
import { rangoMes } from "@/lib/fechas";
import { animalesConCategoria, obtenerConfiguracionFinca } from "@/lib/servicios/inventario";

const SALIDAS: TipoSalida[] = ["DESCARTE", "VENTA", "MUERTE"];

/** Inventario actual (composición, por lote y potrero) y rotación del mes elegido. */
export async function reporteInventario(mes: string) {
  const { desde, hasta } = rangoMes(mes);
  const [activos, config, todos] = await Promise.all([
    animalesConCategoria(),
    obtenerConfiguracionFinca(),
    prismaBase.animal.findMany({
      where: { deletedAt: null },
      select: {
        origen: true,
        fechaIngreso: true,
        movimientos: {
          where: { deletedAt: null, tipo: { in: SALIDAS } },
          select: { tipo: true, fecha: true },
        },
      },
    }),
  ]);
  const rotacion = rotacionInventario(
    todos.map((a) => ({
      origen: a.origen,
      fechaIngreso: a.fechaIngreso,
      salidas: a.movimientos.map((m) => ({ tipo: m.tipo as TipoSalida, fecha: m.fecha })),
    })),
    desde,
    hasta,
  );
  const composicion = composicionHato(
    activos.map((a) => a.categoria),
    config.hato,
  );
  const agrupar = (clave: (a: (typeof activos)[number]) => string) => {
    const m = new Map<string, Record<CategoriaAnimal, number> & { total: number }>();
    for (const a of activos) {
      const k = clave(a);
      const fila =
        m.get(k) ??
        ({ total: 0, ...Object.fromEntries(CATEGORIAS.map((c) => [c, 0])) } as Record<
          CategoriaAnimal,
          number
        > & { total: number });
      fila[a.categoria]++;
      fila.total++;
      m.set(k, fila);
    }
    return [...m.entries()]
      .map(([nombre, fila]) => ({ nombre, ...fila }))
      .sort((x, y) => x.nombre.localeCompare(y.nombre, "es"));
  };
  return {
    rotacion,
    composicion,
    porLote: agrupar((a) => a.lote?.nombre ?? "Sin lote"),
    porPotrero: agrupar((a) => a.potrero?.nombre ?? "Sin potrero"),
    animales: activos.map((a) => ({
      numero: a.numero,
      nombre: a.nombre,
      categoria: ETIQUETA_CATEGORIA[a.categoria],
      lote: a.lote?.nombre ?? "",
      potrero: a.potrero?.nombre ?? "",
    })),
  };
}

export type ReporteInventario = Awaited<ReturnType<typeof reporteInventario>>;
