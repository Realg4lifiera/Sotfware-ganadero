import "server-only";
import { prismaBase } from "@/lib/db";
import {
  alertasReproductivas,
  type Alerta,
  type SituacionAlerta,
} from "@/lib/dominio/alertas-reproductivas";
import { sumarDias } from "@/lib/dominio/gestacion";
import { hoy } from "@/lib/fechas";
import type { HistoriaReproductiva } from "@/lib/indicadores/reproduccion";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";

const max = (fs: (Date | null | undefined)[]) => {
  const v = fs.filter((f): f is Date => !!f);
  return v.length ? new Date(Math.max(...v.map((f) => f.getTime()))) : null;
};

/** Eventos de todas las hembras bovinas (o solo las activas), agrupados por hembra. */
async function cargar(soloActivas: boolean) {
  const vivo = { deletedAt: null } as const;
  const [hembras, servicios, diagnosticos, partos, abortos, lactancias, config] = await Promise.all(
    [
      prismaBase.animal.findMany({
        where: {
          deletedAt: null,
          sexo: "HEMBRA",
          especie: "BOVINO",
          ...(soloActivas ? { estado: "ACTIVO" as const } : {}),
        },
        orderBy: { numero: "asc" },
        select: {
          id: true,
          numero: true,
          nombre: true,
          estado: true,
          fechaNacimiento: true,
          estadoReproductivo: true,
          numeroPartos: true,
        },
      }),
      prismaBase.servicio.findMany({ where: vivo, select: { hembraId: true, fecha: true } }),
      prismaBase.diagnosticoPrenez.findMany({
        where: vivo,
        select: {
          hembraId: true,
          fecha: true,
          resultado: true,
          fechaProbableParto: true,
          servicio: { select: { fecha: true, deletedAt: true } },
        },
      }),
      prismaBase.parto.findMany({ where: vivo, select: { hembraId: true, fecha: true } }),
      prismaBase.aborto.findMany({ where: vivo, select: { hembraId: true, fecha: true } }),
      prismaBase.lactancia.findMany({
        where: { ...vivo, fechaFin: null },
        select: { vacaId: true },
      }),
      obtenerConfiguracionFinca(),
    ],
  );
  const por = <T extends { hembraId: string }>(xs: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of xs) m.set(x.hembraId, [...(m.get(x.hembraId) ?? []), x]);
    return m;
  };
  return {
    hembras,
    servicios: por(servicios),
    diagnosticos: por(diagnosticos),
    partos: por(partos),
    abortos: por(abortos),
    enLactancia: new Set(lactancias.map((l) => l.vacaId)),
    config,
  };
}

/** Alertas reproductivas del hato activo. */
export async function alertasDelHato(): Promise<Alerta[]> {
  const d = await cargar(true);
  const situaciones: SituacionAlerta[] = d.hembras.map((h) => {
    const partos = d.partos.get(h.id) ?? [];
    const ultimoParto = max(partos.map((p) => p.fecha));
    const inicio = max([ultimoParto, ...(d.abortos.get(h.id) ?? []).map((a) => a.fecha)]);
    const servicios = (d.servicios.get(h.id) ?? []).filter((s) => !inicio || s.fecha > inicio);
    const ultimoServicio = max(servicios.map((s) => s.fecha));
    const diags = (d.diagnosticos.get(h.id) ?? []).filter((x) => !inicio || x.fecha > inicio);
    const positivo = diags
      .filter((x) => x.resultado === "PRENADA" && x.fechaProbableParto)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0];
    return {
      id: h.id,
      numero: h.numero,
      nombre: h.nombre,
      estado: h.estadoReproductivo ?? "NOVILLA",
      lactanciaAbierta: d.enLactancia.has(h.id),
      ultimoParto,
      ultimoServicio,
      serviciosCiclo: servicios.length,
      diagnosticadaTrasServicio: !!ultimoServicio && diags.some((x) => x.fecha > ultimoServicio),
      fechaProbableParto: positivo?.fechaProbableParto ?? null,
    };
  });
  return alertasReproductivas(situaciones, d.config.reproduccion, hoy());
}

/** Historias reproductivas de todas las hembras bovinas (para los indicadores). */
export async function historiasReproductivas(): Promise<
  (HistoriaReproductiva & {
    numero: string;
    nombre: string | null;
    estado: string;
    estadoReproductivo: string | null;
  })[]
> {
  const d = await cargar(false);
  return d.hembras.map((h) => {
    // Concepción: fecha del servicio de cada diagnóstico positivo; sin servicio, se
    // estima con la fecha probable de parto. Las reconfirmaciones no se repiten.
    const concepciones = new Map<number, Date>();
    for (const x of d.diagnosticos.get(h.id) ?? []) {
      if (x.resultado !== "PRENADA") continue;
      const f =
        x.servicio && !x.servicio.deletedAt
          ? x.servicio.fecha
          : x.fechaProbableParto
            ? sumarDias(x.fechaProbableParto, -d.config.reproduccion.diasGestacion)
            : null;
      if (f) concepciones.set(f.getTime(), f);
    }
    return {
      id: h.id,
      numero: h.numero,
      nombre: h.nombre,
      estado: h.estado,
      estadoReproductivo: h.estadoReproductivo,
      fechaNacimiento: h.fechaNacimiento,
      numeroPartos: h.numeroPartos,
      partos: (d.partos.get(h.id) ?? []).map((p) => p.fecha),
      servicios: (d.servicios.get(h.id) ?? []).map((s) => s.fecha),
      concepciones: [...concepciones.values()],
    };
  });
}
