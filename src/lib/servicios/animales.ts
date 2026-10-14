import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { ErrorNegocio } from "@/lib/errores";
import type { Opcion } from "@/lib/formularios/campos";
import {
  esquemaCrearAnimal,
  esquemaEditarAnimal,
  esquemaMovimiento,
  type AnimalNuevo,
} from "@/lib/validaciones/animales";
import { ETIQUETA_TIPO_MOVIMIENTO } from "@/lib/etiquetas";

export type { AnimalNuevo };

type Lector = Pick<Tx, "animal" | "toro" | "lote" | "potrero" | "raza">;

/**
 * Reglas que necesitan la base de datos. Devuelve los errores por campo (vacío si todo
 * está bien). La usan el formulario y la importación desde Excel.
 */
export async function erroresRelaciones(
  db: Lector,
  a: Pick<
    AnimalNuevo,
    "madreId" | "padreId" | "loteId" | "potreroId" | "razaId" | "fechaNacimiento"
  >,
  idActual?: string,
): Promise<Record<string, string>> {
  const errores: Record<string, string> = {};
  if (a.madreId) {
    if (a.madreId === idActual) errores.madreId = "Un animal no puede ser su propia madre.";
    else {
      const madre = await db.animal.findFirst({
        where: { id: a.madreId, deletedAt: null },
        select: { sexo: true, especie: true, fechaNacimiento: true, madreId: true },
      });
      if (!madre || madre.sexo !== "HEMBRA")
        errores.madreId = "La madre debe ser una hembra registrada.";
      else if (
        madre.fechaNacimiento &&
        a.fechaNacimiento &&
        madre.fechaNacimiento >= a.fechaNacimiento
      )
        errores.madreId = "La madre debe haber nacido antes que la cría.";
      else if (idActual && madre.madreId === idActual)
        errores.madreId = "La madre no puede ser hija de este animal.";
    }
  }
  if (a.padreId && !(await db.toro.findFirst({ where: { id: a.padreId, deletedAt: null } })))
    errores.padreId = "El toro no existe.";
  if (a.loteId && !(await db.lote.findFirst({ where: { id: a.loteId, deletedAt: null } })))
    errores.loteId = "El lote no existe.";
  if (a.potreroId && !(await db.potrero.findFirst({ where: { id: a.potreroId, deletedAt: null } })))
    errores.potreroId = "El potrero no existe.";
  if (a.razaId && !(await db.raza.findFirst({ where: { id: a.razaId, deletedAt: null } })))
    errores.razaId = "La raza no existe.";
  return errores;
}

/** Inserta el animal con sus registros iniciales (compra y lactancia abierta). */
export async function insertarAnimal(tx: Tx, a: AnimalNuevo): Promise<string> {
  const hembraBovina = a.sexo === "HEMBRA" && a.especie === "BOVINO";
  const animal = await tx.animal.create({
    data: {
      numero: a.numero,
      nombre: a.nombre,
      especie: a.especie,
      sexo: a.sexo,
      razaId: a.razaId,
      fechaNacimiento: a.fechaNacimiento,
      fechaNacimientoEstimada: a.fechaNacimientoEstimada,
      origen: a.origen,
      fechaIngreso: a.fechaIngreso,
      pesoNacimientoKg: a.pesoNacimientoKg,
      madreId: a.madreId,
      padreId: a.padreId,
      loteId: a.loteId,
      potreroId: a.potreroId,
      observaciones: a.observaciones,
      estadoReproductivo: hembraBovina ? (a.estadoReproductivo ?? "NOVILLA") : null,
      numeroPartos: hembraBovina ? a.numeroPartos : 0,
    },
  });
  if (a.origen === "COMPRADO") {
    await tx.movimientoAnimal.create({
      data: {
        animalId: animal.id,
        tipo: "COMPRA",
        fecha: a.fechaIngreso,
        valor: a.valorCompra,
        loteDestinoId: a.loteId,
        potreroDestinoId: a.potreroId,
      },
    });
  }
  if (hembraBovina && a.enProduccion) {
    await tx.lactancia.create({
      data: {
        vacaId: animal.id,
        numero: a.numeroPartos,
        fechaInicio: a.fechaIngreso,
        observaciones: "Lactancia en curso al registrar el animal",
      },
    });
  }
  return animal.id;
}

export async function crearAnimal(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaCrearAnimal.parse(valores) as unknown as AnimalNuevo & {
    numeroPartos: number | null;
  };
  const datos: AnimalNuevo = { ...d, numeroPartos: d.numeroPartos ?? 0 };
  const errores = await erroresRelaciones(tx, datos);
  if (Object.keys(errores).length) throw new ErrorNegocio("Revisa los datos del animal.", errores);
  return insertarAnimal(tx, datos);
}

export async function editarAnimal(tx: Tx, id: string, valores: unknown): Promise<void> {
  const d = esquemaEditarAnimal.parse(valores) as unknown as Omit<
    AnimalNuevo,
    "loteId" | "potreroId" | "estadoReproductivo" | "numeroPartos" | "enProduccion" | "valorCompra"
  >;
  const actual = await tx.animal.findFirst({
    where: { id, deletedAt: null },
    include: { toro: { select: { id: true } }, _count: { select: { crias: true, partos: true } } },
  });
  if (!actual) throw new ErrorNegocio("El animal no existe o fue eliminado.");
  const errores = await erroresRelaciones(tx, { ...d, loteId: null, potreroId: null }, id);
  if (
    actual.sexo !== d.sexo &&
    (actual._count.crias > 0 || actual._count.partos > 0 || actual.toro)
  )
    errores.sexo = "No se puede cambiar el sexo: el animal ya tiene crías o es toro.";
  if (actual.especie !== d.especie && actual.estadoReproductivo && d.especie !== "BOVINO")
    errores.especie = "No se puede cambiar la especie de una hembra con historial reproductivo.";
  if (Object.keys(errores).length) throw new ErrorNegocio("Revisa los datos del animal.", errores);

  const hembraBovina = d.sexo === "HEMBRA" && d.especie === "BOVINO";
  await tx.animal.update({
    where: { id },
    data: {
      numero: d.numero,
      nombre: d.nombre,
      especie: d.especie,
      sexo: d.sexo,
      razaId: d.razaId,
      fechaNacimiento: d.fechaNacimiento,
      fechaNacimientoEstimada: d.fechaNacimientoEstimada,
      origen: d.origen,
      fechaIngreso: d.fechaIngreso,
      pesoNacimientoKg: d.pesoNacimientoKg,
      madreId: d.madreId,
      padreId: d.padreId,
      observaciones: d.observaciones,
      // Si pasa a ser hembra bovina se inicia como novilla; si deja de serlo se limpia.
      estadoReproductivo: hembraBovina ? (actual.estadoReproductivo ?? "NOVILLA") : null,
    },
  });
}

/** Registra un movimiento y actualiza el estado/ubicación del animal. */
export async function registrarMovimiento(
  tx: Tx,
  animalId: string,
  valores: unknown,
): Promise<{ tipo: string }> {
  const m = esquemaMovimiento.parse(valores);
  const animal = await tx.animal.findFirst({ where: { id: animalId, deletedAt: null } });
  if (!animal) throw new ErrorNegocio("El animal no existe o fue eliminado.");

  const permitido =
    animal.estado === "ACTIVO" || (animal.estado === "DESCARTADO" && m.tipo === "VENTA");
  if (!permitido) {
    throw new ErrorNegocio(
      `El animal está ${animal.estado.toLowerCase()}: no se puede registrar ${ETIQUETA_TIPO_MOVIMIENTO[m.tipo].toLowerCase()}.`,
    );
  }
  const minimo = animal.fechaNacimiento ?? animal.fechaIngreso;
  if (m.fecha < minimo)
    throw new ErrorNegocio("Revisa los datos.", {
      fecha: "No puede ser anterior al nacimiento o ingreso.",
    });

  const base = {
    animalId,
    tipo: m.tipo,
    fecha: m.fecha,
    motivo: m.motivo,
    loteOrigenId: animal.loteId,
    potreroOrigenId: animal.potreroId,
  };

  switch (m.tipo) {
    case "TRASLADO_LOTE": {
      if (m.loteDestinoId === animal.loteId)
        throw new ErrorNegocio("Revisa los datos.", {
          loteDestinoId: "El animal ya está en ese lote.",
        });
      const lote = await tx.lote.findFirst({ where: { id: m.loteDestinoId!, deletedAt: null } });
      if (!lote)
        throw new ErrorNegocio("Revisa los datos.", { loteDestinoId: "El lote no existe." });
      await tx.movimientoAnimal.create({ data: { ...base, loteDestinoId: lote.id } });
      await tx.animal.update({ where: { id: animalId }, data: { loteId: lote.id } });
      break;
    }
    case "TRASLADO_POTRERO": {
      if (m.potreroDestinoId === animal.potreroId)
        throw new ErrorNegocio("Revisa los datos.", {
          potreroDestinoId: "El animal ya está en ese potrero.",
        });
      const potrero = await tx.potrero.findFirst({
        where: { id: m.potreroDestinoId!, deletedAt: null },
      });
      if (!potrero)
        throw new ErrorNegocio("Revisa los datos.", { potreroDestinoId: "El potrero no existe." });
      await tx.movimientoAnimal.create({ data: { ...base, potreroDestinoId: potrero.id } });
      await tx.animal.update({ where: { id: animalId }, data: { potreroId: potrero.id } });
      break;
    }
    case "VENTA":
    case "MUERTE":
    case "DESCARTE": {
      const estado = m.tipo === "VENTA" ? "VENDIDO" : m.tipo === "MUERTE" ? "MUERTO" : "DESCARTADO";
      const mov = await tx.movimientoAnimal.create({
        data: {
          ...base,
          valor: m.tipo === "VENTA" ? m.valor : null,
          pesoKg: m.pesoKg,
          compradorId: m.tipo === "VENTA" ? m.compradorId : null,
        },
      });
      if (m.tipo === "VENTA") {
        // El ingreso se genera solo: no se vuelve a digitar en Costos.
        await tx.ingreso.create({
          data: {
            tipo: "VENTA_ANIMAL",
            concepto: animal.estado === "DESCARTADO" ? "Animales de descarte" : "Venta de animales",
            fecha: m.fecha,
            compradorId: m.compradorId,
            cantidad: "1",
            precioUnitario: m.valor!,
            total: m.valor!,
            animalId,
            movimientoAnimalId: mov.id,
          },
        });
      }
      // Sale del inventario: se cierra su lactancia abierta y deja lote/potrero.
      const lactancia = await tx.lactancia.findFirst({
        where: { vacaId: animalId, fechaFin: null, deletedAt: null },
      });
      if (lactancia)
        await tx.lactancia.update({ where: { id: lactancia.id }, data: { fechaFin: m.fecha } });
      await tx.animal.update({
        where: { id: animalId },
        data: {
          estado,
          fechaSalida: m.fecha,
          ...(m.tipo !== "DESCARTE" && { loteId: null, potreroId: null }),
        },
      });
      break;
    }
  }
  return { tipo: m.tipo };
}

/** Borrado lógico (para registros creados por error). Libera el número de chapeta. */
export async function eliminarAnimal(tx: Tx, id: string): Promise<void> {
  const a = await tx.animal.findFirst({
    where: { id, deletedAt: null },
    include: {
      toro: { select: { id: true } },
      _count: {
        select: {
          crias: true,
          partos: true,
          servicios: true,
          ordenos: true,
          gastos: true,
          ingresos: true,
        },
      },
    },
  });
  if (!a) throw new ErrorNegocio("El animal no existe o ya fue eliminado.");
  const c = a._count;
  if (a.toro || c.crias + c.partos + c.servicios + c.ordenos + c.gastos + c.ingresos > 0) {
    throw new ErrorNegocio(
      "No se puede eliminar: el animal tiene historial (crías, eventos, costos o ingresos). Registra su salida con un movimiento de venta, muerte o descarte.",
    );
  }
  await tx.animal.update({
    where: { id },
    data: { deletedAt: new Date(), numero: `${a.numero}~eliminado~${id.slice(-6)}` },
  });
}

/** Opciones de los selects del formulario de animales. */
export async function opcionesAnimal(): Promise<Record<string, Opcion[]>> {
  const [razas, madres, toros, lotes, potreros] = await Promise.all([
    prismaBase.raza.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prismaBase.animal.findMany({
      where: { deletedAt: null, sexo: "HEMBRA", especie: "BOVINO" },
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, nombre: true, estado: true },
    }),
    prismaBase.toro.findMany({
      where: { deletedAt: null },
      orderBy: [{ propio: "desc" }, { nombre: "asc" }],
    }),
    prismaBase.lote.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prismaBase.potrero.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);
  return {
    razas: razas.map((r) => ({ valor: r.id, etiqueta: r.nombre })),
    madres: madres.map((m) => ({
      valor: m.id,
      etiqueta: `${m.numero}${m.nombre ? ` · ${m.nombre}` : ""}${m.estado !== "ACTIVO" ? ` (${m.estado.toLowerCase()})` : ""}`,
    })),
    toros: toros.map((t) => ({
      valor: t.id,
      etiqueta: `${t.nombre}${t.codigo ? ` · ${t.codigo}` : ""}${t.propio ? " (propio)" : ""}`,
    })),
    lotes: lotes.map((l) => ({ valor: l.id, etiqueta: l.nombre })),
    potreros: potreros.map((p) => ({ valor: p.id, etiqueta: p.nombre })),
  };
}
