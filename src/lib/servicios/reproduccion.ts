import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import type { EstadoReproductivo, TipoEventoReproductivo } from "@/generated/prisma/enums";
import { fechaHoraBogota, numeroServicio, partoDesdeDiagnostico } from "@/lib/dominio/gestacion";
import {
  aplicarEvento,
  ErrorTransicion,
  eventosPermitidos,
  type EventoReproductivo,
  type SituacionHembra,
} from "@/lib/dominio/reproduccion";
import { ErrorNegocio } from "@/lib/errores";
import { ETIQUETA_ESTADO_REPRODUCTIVO } from "@/lib/etiquetas";
import { formatoFecha, hoy } from "@/lib/fechas";
import type { Opcion } from "@/lib/formularios/campos";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { moverExistencias } from "@/lib/servicios/pajillas";
import { esquemaCelo, esquemaDiagnostico, esquemaServicio } from "@/lib/validaciones/reproduccion";

/**
 * Servicio del Módulo 2. Todo evento reproductivo pasa por `aplicar()`: valida el orden
 * cronológico, aplica la máquina de estados (lib/dominio/reproduccion.ts), abre o cierra
 * la lactancia y deja la situación anterior en HistorialReproductivo para poder anular el
 * último evento.
 */

type Db = Tx;

interface Hembra {
  id: string;
  numero: string;
  fechaNacimiento: Date | null;
  estado: string;
  estadoReproductivo: EstadoReproductivo;
  numeroPartos: number;
  lactancia: { id: string; fechaInicio: Date } | null;
}

export async function cargarHembra(db: Db, id: string): Promise<Hembra> {
  const a = await db.animal.findFirst({
    where: { id, deletedAt: null, sexo: "HEMBRA", especie: "BOVINO" },
  });
  if (!a) throw new ErrorNegocio("Revisa los datos.", { hembraId: "La hembra no existe." });
  if (a.estado !== "ACTIVO")
    throw new ErrorNegocio("La hembra no está activa (vendida, muerta o descartada).", {
      hembraId: "No está activa.",
    });
  const lactancia = await db.lactancia.findFirst({
    where: { vacaId: id, fechaFin: null, deletedAt: null },
    orderBy: { fechaInicio: "desc" },
    select: { id: true, fechaInicio: true },
  });
  return {
    id: a.id,
    numero: a.numero,
    fechaNacimiento: a.fechaNacimiento,
    estado: a.estado,
    estadoReproductivo: a.estadoReproductivo ?? "NOVILLA",
    numeroPartos: a.numeroPartos,
    lactancia,
  };
}

const situacion = (h: Hembra): SituacionHembra => ({
  estado: h.estadoReproductivo,
  numeroPartos: h.numeroPartos,
  lactanciaAbierta: !!h.lactancia,
});

/** Fecha del evento reproductivo más reciente de la hembra (de cualquier tipo). */
export async function ultimaFechaEvento(db: Db, hembraId: string): Promise<Date | null> {
  const w = { hembraId, deletedAt: null };
  const ord = { orderBy: { fecha: "desc" as const }, select: { fecha: true } };
  const [celo, servicio, diagnostico, parto, aborto, secado, descarte] = await Promise.all([
    db.celo.findFirst({ where: w, orderBy: { fechaHora: "desc" }, select: { fechaHora: true } }),
    db.servicio.findFirst({ where: w, ...ord }),
    db.diagnosticoPrenez.findFirst({ where: w, ...ord }),
    db.parto.findFirst({ where: w, ...ord }),
    db.aborto.findFirst({ where: w, ...ord }),
    db.secado.findFirst({ where: w, ...ord }),
    db.descarteReproductivo.findFirst({ where: w, ...ord }),
  ]);
  const fechas = [
    celo ? new Date(celo.fechaHora.toISOString().slice(0, 10)) : null,
    ...[servicio, diagnostico, parto, aborto, secado, descarte].map((e) => e?.fecha ?? null),
  ].filter((f): f is Date => !!f);
  return fechas.length ? new Date(Math.max(...fechas.map((f) => f.getTime()))) : null;
}

async function validarFecha(tx: Tx, h: Hembra, fecha: Date) {
  if (fecha > hoy())
    throw new ErrorNegocio("Revisa los datos.", { fecha: "No puede ser una fecha futura." });
  if (h.fechaNacimiento && fecha < h.fechaNacimiento)
    throw new ErrorNegocio("Revisa los datos.", {
      fecha: `Es anterior al nacimiento (${formatoFecha(h.fechaNacimiento)}).`,
    });
  const ultima = await ultimaFechaEvento(tx, h.id);
  if (ultima && fecha < ultima)
    throw new ErrorNegocio(
      `La hembra ${h.numero} tiene un evento del ${formatoFecha(ultima)}: los eventos se registran en orden. Si te equivocaste, anula el último.`,
      { fecha: `Debe ser desde el ${formatoFecha(ultima)}.` },
    );
}

interface Aplicacion {
  lactanciaAbiertaId: string | null;
  estadoDespues: EstadoReproductivo;
}

/** Aplica el evento ya guardado (`eventoId`) sobre la hembra y lo anota en la bitácora. */
export async function aplicar(
  tx: Tx,
  h: Hembra,
  evento: EventoReproductivo,
  tipo: TipoEventoReproductivo,
  eventoId: string,
  fecha: Date,
  opciones: { partoId?: string; descartar?: boolean } = {},
): Promise<Aplicacion> {
  let r;
  try {
    r = aplicarEvento(situacion(h), evento);
  } catch (e) {
    if (e instanceof ErrorTransicion) throw new ErrorNegocio(e.message);
    throw e;
  }
  let lactanciaCerradaId: string | null = null;
  let lactanciaAbiertaId: string | null = null;
  if (r.cerrarLactancia && h.lactancia) {
    await tx.lactancia.update({ where: { id: h.lactancia.id }, data: { fechaFin: fecha } });
    lactanciaCerradaId = h.lactancia.id;
  }
  if (r.abrirLactancia) {
    const l = await tx.lactancia.create({
      data: {
        vacaId: h.id,
        partoId: opciones.partoId ?? null,
        numero: r.numeroPartos,
        fechaInicio: fecha,
      },
    });
    lactanciaAbiertaId = l.id;
  }
  if (!r.sinCambio || opciones.descartar)
    await tx.animal.update({
      where: { id: h.id },
      data: {
        estadoReproductivo: r.estado,
        numeroPartos: r.numeroPartos,
        ...(opciones.descartar ? { estado: "DESCARTADO" as const, fechaSalida: fecha } : {}),
      },
    });
  await tx.historialReproductivo.create({
    data: {
      hembraId: h.id,
      fecha,
      tipo,
      eventoId,
      estadoAntes: h.estadoReproductivo,
      estadoDespues: r.estado,
      numeroPartosAntes: h.numeroPartos,
      lactanciaAbiertaId,
      lactanciaCerradaId,
      estadoAnimalAntes: opciones.descartar ? "ACTIVO" : null,
    },
  });
  return { lactanciaAbiertaId, estadoDespues: r.estado };
}

/** Inicio del ciclo actual: último parto o aborto. */
async function inicioCiclo(db: Db, hembraId: string): Promise<Date | null> {
  const w = { hembraId, deletedAt: null };
  const [parto, aborto] = await Promise.all([
    db.parto.findFirst({ where: w, orderBy: { fecha: "desc" }, select: { fecha: true } }),
    db.aborto.findFirst({ where: w, orderBy: { fecha: "desc" }, select: { fecha: true } }),
  ]);
  const f = [parto?.fecha, aborto?.fecha].filter((x): x is Date => !!x);
  return f.length ? new Date(Math.max(...f.map((x) => x.getTime()))) : null;
}

// ─── Celo ────────────────────────────────────────────────────────────────────

export async function registrarCelo(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaCelo.parse(valores) as Record<string, unknown>;
  const h = await cargarHembra(tx, String(d.hembraId));
  const fecha = d.fecha as Date;
  await validarFecha(tx, h, fecha);
  const celo = await tx.celo.create({
    data: {
      hembraId: h.id,
      fechaHora: fechaHoraBogota(fecha, (d.hora as string | null) ?? null),
      observaciones: (d.observaciones as string | null) ?? null,
    },
  });
  await aplicar(tx, h, { tipo: "CELO" }, "CELO", celo.id, fecha);
  return celo.id;
}

// ─── Servicio ────────────────────────────────────────────────────────────────

export async function registrarServicio(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaServicio.parse(valores) as Record<string, unknown>;
  const h = await cargarHembra(tx, String(d.hembraId));
  const fecha = d.fecha as Date;
  await validarFecha(tx, h, fecha);
  const tipo = d.tipo as "MONTA_NATURAL" | "INSEMINACION";

  let toroId: string;
  let pajillaId: string | null = null;
  if (tipo === "INSEMINACION") {
    const p = await tx.pajilla.findFirst({
      where: { id: String(d.pajillaId), deletedAt: null, activo: true },
    });
    if (!p) throw new ErrorNegocio("Revisa los datos.", { pajillaId: "La pajilla no existe." });
    pajillaId = p.id;
    toroId = p.toroId;
  } else {
    const t = await tx.toro.findFirst({ where: { id: String(d.toroId), deletedAt: null } });
    if (!t) throw new ErrorNegocio("Revisa los datos.", { toroId: "El toro no existe." });
    toroId = t.id;
  }

  const [previos, inicio, celo] = await Promise.all([
    tx.servicio.findMany({ where: { hembraId: h.id, deletedAt: null }, select: { fecha: true } }),
    inicioCiclo(tx, h.id),
    // Celo del mismo día o del día anterior sin servicio: queda vinculado.
    tx.celo.findFirst({
      where: {
        hembraId: h.id,
        deletedAt: null,
        servicio: null,
        fechaHora: {
          gte: new Date(fecha.getTime() - 86_400_000),
          lt: new Date(fecha.getTime() + 2 * 86_400_000),
        },
      },
      orderBy: { fechaHora: "desc" },
    }),
  ]);
  const servicio = await tx.servicio.create({
    data: {
      hembraId: h.id,
      fecha,
      tipo,
      toroId,
      pajillaId,
      inseminador: tipo === "INSEMINACION" ? ((d.inseminador as string | null) ?? null) : null,
      numeroServicio: numeroServicio(
        previos.map((s) => s.fecha),
        inicio,
        fecha,
      ),
      celoId: celo?.id ?? null,
      observaciones: (d.observaciones as string | null) ?? null,
    },
  });
  if (pajillaId) {
    await moverExistencias(tx, pajillaId, -1);
    await tx.movimientoPajilla.create({
      data: { pajillaId, tipo: "USO", fecha, cantidad: -1, servicioId: servicio.id },
    });
  }
  await aplicar(tx, h, { tipo: "SERVICIO" }, "SERVICIO", servicio.id, fecha);
  return servicio.id;
}

// ─── Diagnóstico de preñez ───────────────────────────────────────────────────

export async function registrarDiagnostico(tx: Tx, valores: unknown): Promise<string> {
  const d = esquemaDiagnostico.parse(valores) as Record<string, unknown>;
  const h = await cargarHembra(tx, String(d.hembraId));
  const fecha = d.fecha as Date;
  await validarFecha(tx, h, fecha);
  const resultado = d.resultado as "PRENADA" | "VACIA";
  const inicio = await inicioCiclo(tx, h.id);
  const servicio = await tx.servicio.findFirst({
    where: {
      hembraId: h.id,
      deletedAt: null,
      fecha: { lte: fecha, ...(inicio ? { gt: inicio } : {}) },
    },
    orderBy: { fecha: "desc" },
  });
  const config = await obtenerConfiguracionFinca();
  const diasGestacion =
    resultado === "PRENADA" ? ((d.diasGestacion as number | null) ?? null) : null;
  const fechaProbableParto =
    resultado === "PRENADA"
      ? partoDesdeDiagnostico(
          { fecha, diasGestacion, fechaServicio: servicio?.fecha ?? null },
          config.reproduccion.diasGestacion,
        )
      : null;
  const diag = await tx.diagnosticoPrenez.create({
    data: {
      hembraId: h.id,
      fecha,
      metodo: d.metodo as "PALPACION" | "ECOGRAFIA",
      resultado,
      diasGestacion,
      fechaProbableParto,
      servicioId: servicio?.id ?? null,
      veterinario: (d.veterinario as string | null) ?? null,
      observaciones: (d.observaciones as string | null) ?? null,
    },
  });
  await aplicar(tx, h, { tipo: "DIAGNOSTICO", resultado }, "DIAGNOSTICO", diag.id, fecha);
  return diag.id;
}

// ─── Anular el último evento ─────────────────────────────────────────────────

export async function ultimoHistorial(db: Db, hembraId: string) {
  return db.historialReproductivo.findFirst({
    where: { hembraId, deletedAt: null },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
  });
}

const borrado = { deletedAt: new Date() };

/** Anula el último evento registrado de la hembra y la devuelve a su situación anterior. */
export async function anularUltimoEvento(tx: Tx, hembraId: string): Promise<string> {
  const ultimo = await ultimoHistorial(tx, hembraId);
  if (!ultimo) throw new ErrorNegocio("Esta hembra no tiene eventos registrados para anular.");
  const ahora = new Date();
  const id = ultimo.eventoId;

  switch (ultimo.tipo) {
    case "CELO":
      await tx.celo.update({ where: { id }, data: { deletedAt: ahora } });
      break;
    case "SERVICIO": {
      const s = await tx.servicio.update({ where: { id }, data: { deletedAt: ahora } });
      if (s.pajillaId) {
        await moverExistencias(tx, s.pajillaId, 1);
        const m = await tx.movimientoPajilla.findFirst({
          where: { servicioId: id, deletedAt: null },
        });
        if (m)
          await tx.movimientoPajilla.update({ where: { id: m.id }, data: { deletedAt: ahora } });
      }
      break;
    }
    case "DIAGNOSTICO":
      await tx.diagnosticoPrenez.update({ where: { id }, data: { deletedAt: ahora } });
      break;
    case "PARTO": {
      const crias = await tx.animal.findMany({ where: { partoId: id, deletedAt: null } });
      for (const c of crias) {
        const [eventos, pesajes] = await Promise.all([
          tx.historialReproductivo.count({ where: { hembraId: c.id, deletedAt: null } }),
          tx.pesaje.count({ where: { animalId: c.id, deletedAt: null } }),
        ]);
        if (eventos + pesajes > 0)
          throw new ErrorNegocio(
            `La cría ${c.numero} ya tiene registros propios: corrígelos antes de anular el parto.`,
          );
        await tx.animal.update({ where: { id: c.id }, data: { deletedAt: ahora } });
      }
      await tx.parto.update({ where: { id }, data: { deletedAt: ahora } });
      break;
    }
    case "ABORTO":
      await tx.aborto.update({ where: { id }, data: { deletedAt: ahora } });
      break;
    case "SECADO":
      await tx.secado.update({ where: { id }, data: { deletedAt: ahora } });
      break;
    case "DESCARTE":
      await tx.descarteReproductivo.update({ where: { id }, data: { deletedAt: ahora } });
      break;
  }

  if (ultimo.lactanciaAbiertaId) {
    const ordenos = await tx.registroOrdeno.count({
      where: { lactanciaId: ultimo.lactanciaAbiertaId, deletedAt: null },
    });
    if (ordenos > 0)
      throw new ErrorNegocio(
        "La lactancia que abrió este parto ya tiene ordeños registrados: elimínalos antes de anular.",
      );
    await tx.lactancia.update({ where: { id: ultimo.lactanciaAbiertaId }, data: borrado });
  }
  if (ultimo.lactanciaCerradaId)
    await tx.lactancia.update({
      where: { id: ultimo.lactanciaCerradaId },
      data: { fechaFin: null },
    });

  await tx.animal.update({
    where: { id: hembraId },
    data: {
      estadoReproductivo: ultimo.estadoAntes,
      numeroPartos: ultimo.numeroPartosAntes,
      ...(ultimo.estadoAnimalAntes ? { estado: ultimo.estadoAnimalAntes, fechaSalida: null } : {}),
    },
  });
  await tx.historialReproductivo.update({ where: { id: ultimo.id }, data: { deletedAt: ahora } });
  return ultimo.tipo;
}

// ─── Opciones de los formularios ─────────────────────────────────────────────

/** Hembras bovinas activas a las que se les puede registrar el evento. */
export async function hembrasPara(
  filtro: (permitidos: EventoReproductivo[]) => boolean,
): Promise<Opcion[]> {
  const [hembras, lactancias] = await Promise.all([
    prismaBase.animal.findMany({
      where: { deletedAt: null, estado: "ACTIVO", sexo: "HEMBRA", especie: "BOVINO" },
      orderBy: { numero: "asc" },
      select: {
        id: true,
        numero: true,
        nombre: true,
        estadoReproductivo: true,
        numeroPartos: true,
      },
    }),
    prismaBase.lactancia.findMany({
      where: { fechaFin: null, deletedAt: null },
      select: { vacaId: true },
    }),
  ]);
  const enLactancia = new Set(lactancias.map((l) => l.vacaId));
  return hembras
    .filter((h) =>
      filtro(
        eventosPermitidos({
          estado: h.estadoReproductivo ?? "NOVILLA",
          numeroPartos: h.numeroPartos,
          lactanciaAbierta: enLactancia.has(h.id),
        }),
      ),
    )
    .map((h) => ({
      valor: h.id,
      etiqueta: [
        h.numero,
        h.nombre,
        ETIQUETA_ESTADO_REPRODUCTIVO[h.estadoReproductivo ?? "NOVILLA"] +
          (enLactancia.has(h.id) ? " en producción" : ""),
      ]
        .filter(Boolean)
        .join(" · "),
    }));
}

export const permite = (tipo: EventoReproductivo["tipo"]) => (p: EventoReproductivo[]) =>
  p.some((e) => e.tipo === tipo);

export async function opcionesServicio(): Promise<Record<string, Opcion[]>> {
  const [hembras, toros, pajillas] = await Promise.all([
    hembrasPara(permite("SERVICIO")),
    prismaBase.toro.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prismaBase.pajilla.findMany({
      where: { deletedAt: null, activo: true, existencias: { gt: 0 } },
      include: { toro: { select: { nombre: true } } },
      orderBy: { toro: { nombre: "asc" } },
    }),
  ]);
  return {
    hembras,
    toros: toros.map((t) => ({
      valor: t.id,
      etiqueta: t.codigo ? `${t.nombre} (${t.codigo})` : t.nombre,
    })),
    pajillas: pajillas.map((p) => ({
      valor: p.id,
      etiqueta: [p.toro.nombre, p.codigo, `${p.existencias} en termo`].filter(Boolean).join(" · "),
    })),
  };
}

/** Ids de eventos que son el último de su hembra (los únicos que se pueden anular). */
export async function eventosAnulables(hembraIds: string[]): Promise<Set<string>> {
  if (hembraIds.length === 0) return new Set();
  const filas = await prismaBase.historialReproductivo.findMany({
    where: { hembraId: { in: [...new Set(hembraIds)] }, deletedAt: null },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    select: { hembraId: true, eventoId: true },
  });
  const vistos = new Set<string>();
  const ultimos = new Set<string>();
  for (const f of filas) {
    if (vistos.has(f.hembraId)) continue;
    vistos.add(f.hembraId);
    ultimos.add(f.eventoId);
  }
  return ultimos;
}

export const nombreHembra = (a: { numero: string; nombre: string | null }) =>
  a.nombre ? `${a.numero} · ${a.nombre}` : a.numero;
