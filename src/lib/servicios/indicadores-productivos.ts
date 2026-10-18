import "server-only";
import { prismaBase } from "@/lib/db";
import { idFinca } from "@/lib/finca";
import { rangoMes } from "@/lib/fechas";
import {
  diasSolapados,
  dividir,
  kilosGanadosEnPeriodo,
  sumaDias,
} from "@/lib/indicadores/produccion";
import { costosDelMes } from "@/lib/servicios/costos";
import { litrosDelPeriodo } from "@/lib/servicios/leche";

/** Centros cuyos costos van al costo por kilo ganado. */
const CENTROS_CARNE = ["CRIA_LEVANTE", "CEBA"];
/** Lotes cuyos animales cuentan para los kilos ganados. */
const LOTES_CARNE = ["CRIA", "LEVANTE", "CEBA"] as const;

/** Indicadores productivos y de costo del mes ("AAAA-MM"). Pendientes de validación. */
export async function indicadoresProductivosMes(mes: string) {
  const { desde, hasta } = rangoMes(mes);
  const [litros, lineas, centros, animales, lactancias, finca] = await Promise.all([
    litrosDelPeriodo(desde, hasta),
    costosDelMes(mes),
    prismaBase.centroCosto.findMany({
      where: { clave: { in: CENTROS_CARNE }, deletedAt: null },
      select: { id: true },
    }),
    prismaBase.animal.findMany({
      where: { deletedAt: null, fechaIngreso: { lt: hasta } },
      select: {
        id: true,
        fechaIngreso: true,
        fechaSalida: true,
        lote: { select: { id: true, nombre: true, proposito: true } },
        pesajes: { where: { deletedAt: null }, select: { fecha: true, pesoKg: true } },
      },
    }),
    prismaBase.lactancia.findMany({
      where: { deletedAt: null, fechaInicio: { lt: hasta } },
      select: { fechaInicio: true, fechaFin: true },
    }),
    prismaBase.finca.findUnique({ where: { id: await idFinca() }, select: { areaUtilHa: true } }),
  ]);

  const costoTotal = Math.round(lineas.reduce((s, l) => s + l.monto, 0));
  const idsCarne = new Set(centros.map((c) => c.id));
  const costoCarne = Math.round(
    lineas
      .filter((l) => l.centroCostoId && idsCarne.has(l.centroCostoId))
      .reduce((s, l) => s + l.monto, 0),
  );

  const animalDias = sumaDias(
    animales.map((a) => ({ inicio: a.fechaIngreso, fin: a.fechaSalida })),
    desde,
    hasta,
  );
  const vacaDias = sumaDias(
    lactancias.map((l) => ({ inicio: l.fechaInicio, fin: l.fechaFin })),
    desde,
    hasta,
  );

  // Ganancia por lote de carne: kilos del período / días cubiertos por pesajes.
  const lotes = new Map<
    string,
    { nombre: string; animales: number; kilos: number; dias: number }
  >();
  for (const a of animales) {
    if (!a.lote || !LOTES_CARNE.includes(a.lote.proposito as (typeof LOTES_CARNE)[number]))
      continue;
    const pesajes = a.pesajes
      .map((p) => ({ fecha: p.fecha, pesoKg: Number(p.pesoKg) }))
      .sort((x, y) => x.fecha.getTime() - y.fecha.getTime());
    let dias = 0;
    for (let i = 1; i < pesajes.length; i++)
      dias += diasSolapados(pesajes[i - 1].fecha, pesajes[i].fecha, desde, hasta);
    if (dias === 0) continue;
    const l = lotes.get(a.lote.id) ?? { nombre: a.lote.nombre, animales: 0, kilos: 0, dias: 0 };
    l.animales++;
    l.kilos += kilosGanadosEnPeriodo(pesajes, desde, hasta);
    l.dias += dias;
    lotes.set(a.lote.id, l);
  }
  const ganancia = [...lotes.values()]
    .map((l) => ({
      ...l,
      kilos: Math.round(l.kilos * 10) / 10,
      gdp: dividir(l.kilos * 1000, l.dias, 0),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const kilos = Math.round(ganancia.reduce((s, l) => s + l.kilos, 0) * 10) / 10;
  const area = finca?.areaUtilHa ? Number(finca.areaUtilHa) : null;

  return {
    litrosProducidos: litros.producidos,
    vacaDias,
    litrosVacaDia: dividir(litros.producidos, vacaDias, 1),
    litrosHa: area ? dividir(litros.producidos, area, 1) : null,
    animalDias,
    costoTotal,
    costoAnimalDia: costoTotal > 0 ? dividir(costoTotal, animalDias, 0) : null,
    kilosGanados: kilos,
    costoCarne,
    // Sin costos asignados a cría, levante o ceba el indicador no aplica (no es $ 0).
    costoKiloGanado: costoCarne > 0 ? dividir(costoCarne, kilos, 0) : null,
    ganancia,
  };
}

export type IndicadoresProductivos = Awaited<ReturnType<typeof indicadoresProductivosMes>>;
