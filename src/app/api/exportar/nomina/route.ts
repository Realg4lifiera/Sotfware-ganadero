import ExcelJS from "exceljs";
import { prismaBase } from "@/lib/db";
import { ESTILO_ENCABEZADO } from "@/lib/excel/libro";
import { ETIQUETA_TIPO_CONTRATO } from "@/lib/etiquetas";
import { mesDesdeParametro, rangoMes } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import { obtenerUsuarioActual } from "@/lib/sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(req: Request) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  if (!puede(usuario.rol, "costos:leer")) return new Response("Sin permiso", { status: 403 });
  const mes = mesDesdeParametro(new URL(req.url).searchParams.get("mes"));
  const { desde, hasta } = rangoMes(mes);
  const pagos = await prismaBase.pagoNomina.findMany({
    where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "asc" }],
    include: { trabajador: true, centroCosto: true },
  });
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Nómina", { views: [{ state: "frozen", ySplit: 1 }] });
  const pesos = { numFmt: '"$" #,##0' };
  const conceptos = [
    ["salario", "Salario"],
    ["auxilioTransporte", "Auxilio de transporte"],
    ["salud", "Salud"],
    ["pension", "Pensión"],
    ["arl", "ARL"],
    ["prima", "Prima"],
    ["vacaciones", "Vacaciones"],
    ["cesantias", "Cesantías"],
    ["interesesCesantias", "Intereses cesantías"],
    ["bonificacion", "Bonificación"],
    ["costoTotal", "Costo total"],
  ] as const;
  hoja.columns = [
    { header: "Trabajador", key: "trabajador", width: 24 },
    { header: "Tipo de contrato", key: "contrato", width: 26 },
    { header: "Fecha de pago", key: "fecha", width: 13, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Centro de costo", key: "centro", width: 18 },
    { header: "Labor", key: "labor", width: 18 },
    ...conceptos.map(([key, header]) => ({ header, key, width: 14, style: pesos })),
  ];
  hoja.getRow(1).height = 28;
  hoja.getRow(1).eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  for (const p of pagos) {
    hoja.addRow({
      trabajador: p.trabajador.nombre,
      contrato: ETIQUETA_TIPO_CONTRATO[p.trabajador.tipoContrato],
      fecha: p.fecha,
      centro: p.centroCosto.nombre,
      labor: p.labor ?? "",
      ...Object.fromEntries(conceptos.map(([k]) => [k, Number(p[k])])),
    });
  }
  return new Response((await libro.xlsx.writeBuffer()) as ArrayBuffer, {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="nomina-${mes}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
