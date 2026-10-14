import "server-only";
import ExcelJS from "exceljs";
import { composicionHato, ETIQUETA_CATEGORIA } from "@/lib/dominio/categoria";
import {
  ETIQUETA_ESPECIE,
  ETIQUETA_ESTADO_ANIMAL,
  ETIQUETA_ESTADO_REPRODUCTIVO,
  ETIQUETA_ORIGEN,
  ETIQUETA_SEXO,
} from "@/lib/etiquetas";
import { hoy, mesesEntre } from "@/lib/fechas";
import { prismaBase } from "@/lib/db";
import { animalesConCategoria, obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { ESTILO_ENCABEZADO } from "./libro";

/** Inventario completo de animales (todos los estados) + composición del hato. */
export async function generarExcelInventario(): Promise<ArrayBuffer> {
  const [animales, config, finca] = await Promise.all([
    animalesConCategoria({}),
    obtenerConfiguracionFinca(),
    prismaBase.finca.findUnique({ where: { id: 1 }, select: { nombre: true } }),
  ]);
  const madres = new Map(
    (
      await prismaBase.animal.findMany({
        where: { id: { in: animales.map((a) => a.madreId).filter((x): x is string => !!x) } },
        select: { id: true, numero: true },
      })
    ).map((m) => [m.id, m.numero]),
  );
  const toros = new Map(
    (await prismaBase.toro.findMany({ select: { id: true, nombre: true, codigo: true } })).map(
      (t) => [t.id, t.codigo ? `${t.nombre} (${t.codigo})` : t.nombre],
    ),
  );
  const ref = hoy();

  const libro = new ExcelJS.Workbook();
  libro.creator = "Campo Verde";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Inventario", { views: [{ state: "frozen", ySplit: 1 }] });
  hoja.columns = [
    { header: "Número / chapeta", key: "numero", width: 14 },
    { header: "Nombre", key: "nombre", width: 16 },
    { header: "Especie", key: "especie", width: 10 },
    { header: "Sexo", key: "sexo", width: 9 },
    { header: "Raza", key: "raza", width: 22 },
    { header: "Categoría", key: "categoria", width: 20 },
    { header: "Estado", key: "estado", width: 11 },
    { header: "Estado reproductivo", key: "estadoReproductivo", width: 14 },
    { header: "Partos", key: "partos", width: 8 },
    { header: "En producción", key: "enProduccion", width: 11 },
    {
      header: "Fecha de nacimiento",
      key: "fechaNacimiento",
      width: 13,
      style: { numFmt: "dd/mm/yyyy" },
    },
    { header: "Edad (meses)", key: "edad", width: 10 },
    { header: "Origen", key: "origen", width: 16 },
    { header: "Fecha de ingreso", key: "fechaIngreso", width: 13, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Madre", key: "madre", width: 10 },
    { header: "Padre (toro)", key: "padre", width: 20 },
    { header: "Lote", key: "lote", width: 20 },
    { header: "Potrero", key: "potrero", width: 16 },
    { header: "Fecha de salida", key: "fechaSalida", width: 13, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Observaciones", key: "observaciones", width: 30 },
  ];
  hoja.getRow(1).height = 30;
  hoja.getRow(1).eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  for (const a of animales) {
    hoja.addRow({
      numero: a.numero,
      nombre: a.nombre ?? "",
      especie: ETIQUETA_ESPECIE[a.especie],
      sexo: ETIQUETA_SEXO[a.sexo],
      raza: a.raza?.nombre ?? "",
      categoria: ETIQUETA_CATEGORIA[a.categoria],
      estado: ETIQUETA_ESTADO_ANIMAL[a.estado],
      estadoReproductivo: a.estadoReproductivo
        ? ETIQUETA_ESTADO_REPRODUCTIVO[a.estadoReproductivo]
        : "",
      partos: a.sexo === "HEMBRA" ? a.numeroPartos : null,
      enProduccion: a.lactancias.length > 0 ? "Sí" : "No",
      fechaNacimiento: a.fechaNacimiento,
      edad: a.fechaNacimiento ? mesesEntre(a.fechaNacimiento, a.fechaSalida ?? ref) : null,
      origen: ETIQUETA_ORIGEN[a.origen],
      fechaIngreso: a.fechaIngreso,
      madre: a.madreId ? (madres.get(a.madreId) ?? "") : "",
      padre: a.padreId ? (toros.get(a.padreId) ?? "") : "",
      lote: a.lote?.nombre ?? "",
      potrero: a.potrero?.nombre ?? "",
      fechaSalida: a.fechaSalida,
      observaciones: a.observaciones ?? "",
    });
  }
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: hoja.columnCount } };

  // Composición del hato (solo animales activos).
  const activos = animales.filter((a) => a.estado === "ACTIVO");
  const { hato, otras, totalHato, totalOtras } = composicionHato(
    activos.map((a) => a.categoria),
    config.hato,
  );
  const comp = libro.addWorksheet("Composición del hato");
  comp.columns = [
    { header: "Categoría", key: "c", width: 26 },
    { header: "Cantidad", key: "n", width: 10 },
    { header: "% actual", key: "real", width: 10, style: { numFmt: "0%" } },
    { header: "% ideal", key: "ideal", width: 10, style: { numFmt: "0%" } },
  ];
  comp.getRow(1).eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  for (const f of hato)
    comp.addRow({ c: f.etiqueta, n: f.cantidad, real: f.porcentajeReal, ideal: f.porcentajeIdeal });
  comp.addRow({ c: "Total inventario bovino", n: totalHato }).font = { bold: true };
  comp.addRow({});
  for (const f of otras) comp.addRow({ c: f.etiqueta, n: f.cantidad, real: f.porcentajeReal });
  comp.addRow({ c: "Total ganado de carne y otras especies", n: totalOtras }).font = { bold: true };
  comp.addRow({});
  comp.addRow({ c: `${finca?.nombre ?? "Finca"} · generado el ${ref.toISOString().slice(0, 10)}` });

  return (await libro.xlsx.writeBuffer()) as ArrayBuffer;
}
