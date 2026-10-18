import "server-only";
import ExcelJS from "exceljs";
import { ETIQUETA_AGRUPACION, type Agrupacion } from "@/lib/dominio/reporte-costos";
import { nombreMes } from "@/lib/fechas";
import type { ReporteCostos } from "@/lib/servicios/reporte-costos";
import { ESTILO_ENCABEZADO } from "./libro";

export async function generarExcelReporteCostos(
  r: ReporteCostos,
  por: Agrupacion,
): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Campo Verde";
  const hoja = libro.addWorksheet("Costos", { views: [{ state: "frozen", xSplit: 1, ySplit: 1 }] });
  const pesos = '"$" #,##0';
  hoja.columns = [
    { header: ETIQUETA_AGRUPACION[por], key: "nombre", width: 32 },
    ...r.meses.map((m) => ({ header: nombreMes(m), key: m, width: 16, style: { numFmt: pesos } })),
    { header: "Total", key: "total", width: 16, style: { numFmt: pesos } },
    { header: "% participación", key: "participacion", width: 14, style: { numFmt: "0.0%" } },
  ];
  hoja.getRow(1).height = 30;
  hoja.getRow(1).eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  for (const f of r.filas)
    hoja.addRow({ nombre: f.nombre, ...f.porMes, total: f.total, participacion: f.participacion });
  const t = hoja.addRow({ nombre: "Total", ...r.totalPorMes, total: r.total, participacion: 1 });
  t.font = { bold: true };
  return (await libro.xlsx.writeBuffer()) as ArrayBuffer;
}
