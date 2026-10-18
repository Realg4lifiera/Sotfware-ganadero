import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { unidadesAnimales } from "@/lib/dominio/categoria";
import { ErrorNegocio } from "@/lib/errores";
import { diasEntre, formatoFecha, hoy } from "@/lib/fechas";
import type { Opcion } from "@/lib/formularios/campos";
import { animalesConCategoria, obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { esquemaRotacion } from "@/lib/validaciones/rotacion";

/**
 * Mueve un lote a otro potrero: cierra su ocupación actual, abre la nueva y traslada a
 * todos sus animales activos (con su movimiento de potrero, como en Animales).
 */
export async function rotarLote(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaRotacion.parse(valores) as Record<string, unknown>;
  const loteId = String(d.loteId);
  const potreroId = String(d.potreroId);
  const fecha = d.fecha as Date;
  const [lote, potrero] = await Promise.all([
    tx.lote.findFirst({ where: { id: loteId, deletedAt: null } }),
    tx.potrero.findFirst({ where: { id: potreroId, deletedAt: null } }),
  ]);
  if (!lote) throw new ErrorNegocio("Revisa los datos.", { loteId: "El lote no existe." });
  if (!potrero) throw new ErrorNegocio("Revisa los datos.", { potreroId: "El potrero no existe." });

  const actual = await tx.ocupacionPotrero.findFirst({
    where: { loteId, fechaSalida: null, deletedAt: null },
    orderBy: { fechaEntrada: "desc" },
  });
  if (actual) {
    if (actual.potreroId === potreroId)
      throw new ErrorNegocio("Revisa los datos.", { potreroId: "El lote ya está en ese potrero." });
    if (fecha < actual.fechaEntrada)
      throw new ErrorNegocio("Revisa los datos.", {
        fecha: `El lote entró a su potrero actual el ${formatoFecha(actual.fechaEntrada)}.`,
      });
    await tx.ocupacionPotrero.update({ where: { id: actual.id }, data: { fechaSalida: fecha } });
  }
  const nueva = await tx.ocupacionPotrero.create({
    data: {
      loteId,
      potreroId,
      fechaEntrada: fecha,
      observaciones: (d.observaciones as string | null) ?? null,
    },
  });
  const animales = await tx.animal.findMany({
    where: { loteId, deletedAt: null, estado: "ACTIVO" },
    select: { id: true, potreroId: true },
  });
  for (const a of animales) {
    if (a.potreroId === potreroId) continue;
    await tx.movimientoAnimal.create({
      data: {
        animalId: a.id,
        tipo: "TRASLADO_POTRERO",
        fecha,
        motivo: `Rotación de ${lote.nombre}`,
        loteOrigenId: loteId,
        potreroOrigenId: a.potreroId,
        potreroDestinoId: potreroId,
      },
    });
    await tx.animal.update({ where: { id: a.id }, data: { potreroId } });
  }
  return nueva.id;
}

export async function opcionesRotacion(): Promise<Record<string, Opcion[]>> {
  const activo = { deletedAt: null, activo: true } as const;
  const [lotes, potreros] = await Promise.all([
    prismaBase.lote.findMany({ where: activo, orderBy: { nombre: "asc" } }),
    prismaBase.potrero.findMany({ where: activo, orderBy: { nombre: "asc" } }),
  ]);
  return {
    lotes: lotes.map((l) => ({ valor: l.id, etiqueta: l.nombre })),
    potreros: potreros.map((p) => ({
      valor: p.id,
      etiqueta: p.areaHa
        ? `${p.nombre} (${Number(p.areaHa).toLocaleString("es-CO")} ha)`
        : p.nombre,
    })),
  };
}

/** Estado actual de cada potrero: ocupación o descanso, animales y carga (UA/ha). */
export async function estadoPotreros() {
  const ref = hoy();
  const [potreros, ocupaciones, animales, config, finca] = await Promise.all([
    prismaBase.potrero.findMany({ where: { deletedAt: null }, orderBy: { nombre: "asc" } }),
    prismaBase.ocupacionPotrero.findMany({
      where: { deletedAt: null },
      orderBy: { fechaEntrada: "desc" },
      include: { lote: { select: { nombre: true } } },
    }),
    animalesConCategoria(),
    obtenerConfiguracionFinca(),
    prismaBase.finca.findUnique({ where: { id: 1 }, select: { areaUtilHa: true } }),
  ]);
  const ua = config.cargaAnimal;
  const filas = potreros.map((p) => {
    const abiertas = ocupaciones.filter((o) => o.potreroId === p.id && !o.fechaSalida);
    const ultimaSalida = ocupaciones
      .filter((o) => o.potreroId === p.id && o.fechaSalida)
      .map((o) => o.fechaSalida!)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const aqui = animales.filter((a) => a.potreroId === p.id);
    const unidades = unidadesAnimales(
      aqui.map((a) => a.categoria),
      ua,
    );
    const area = p.areaHa ? Number(p.areaHa) : null;
    return {
      id: p.id,
      nombre: p.nombre,
      areaHa: area,
      tipoPasto: p.tipoPasto,
      activo: p.activo,
      lotes: abiertas.map((o) => ({
        nombre: o.lote.nombre,
        desde: o.fechaEntrada,
        dias: diasEntre(o.fechaEntrada, ref),
      })),
      descansoDias: abiertas.length === 0 && ultimaSalida ? diasEntre(ultimaSalida, ref) : null,
      animales: aqui.length,
      ua: unidades,
      cargaUaHa: area ? Math.round((unidades / area) * 100) / 100 : null,
    };
  });
  const totalUa = unidadesAnimales(
    animales.map((a) => a.categoria),
    ua,
  );
  const areaPotreros = filas.reduce((s, f) => s + (f.areaHa ?? 0), 0);
  const area = finca?.areaUtilHa ? Number(finca.areaUtilHa) : areaPotreros;
  return {
    potreros: filas,
    totalUa,
    areaHa: area,
    cargaUaHa: area ? Math.round((totalUa / area) * 100) / 100 : null,
    historial: ocupaciones.slice(0, 20).map((o) => ({
      id: o.id,
      lote: o.lote.nombre,
      potrero: potreros.find((p) => p.id === o.potreroId)?.nombre ?? "",
      entrada: o.fechaEntrada,
      salida: o.fechaSalida,
      dias: diasEntre(o.fechaEntrada, o.fechaSalida ?? ref),
    })),
  };
}
