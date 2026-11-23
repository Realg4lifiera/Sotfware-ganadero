import "server-only";
import ExcelJS from "exceljs";
import { formatoFecha } from "@/lib/fechas";
import type { ReporteReproductivo } from "@/lib/servicios/reporte-reproductivo";
import { ESTILO_ENCABEZADO } from "./libro";

export async function generarExcelReproductivo(r: ReporteReproductivo): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Campo Verde";
  const ind = libro.addWorksheet("Indicadores");
  ind.columns = [{ width: 34 }, { width: 14 }, { width: 14 }];
  const hastaIncl = new Date(r.hasta.getTime() - 86_400_000);
  ind.addRow([
    `Indicadores reproductivos · ${formatoFecha(r.desde)} a ${formatoFecha(hastaIncl)}`,
  ]).font = { bold: true, size: 13 };
  ind.addRow(["Fórmulas validadas con el veterinario."]).font = { italic: true };
  ind.addRow([]);
  const enc = ind.addRow(["Indicador", "Valor", "Base (n)"]);
  enc.eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  const i = r.indicadores;
  ind.addRow(["Intervalo entre partos (días)", i.iepPromedio, i.n.iep]);
  ind.addRow(["Días abiertos (promedio)", i.diasAbiertosPromedio, i.n.diasAbiertos]);
  ind.addRow(["Servicios por concepción", i.serviciosPorConcepcion, i.n.concepciones]);
  const t = ind.addRow(["Tasa de preñez", i.tasaPrenez, i.n.expuestas]);
  t.getCell(2).numFmt = "0.0%";
  ind.addRow(["Edad al primer parto (meses)", i.edadPrimerPartoMeses, i.n.primerParto]);

  const hoja = libro.addWorksheet("Por vaca", { views: [{ state: "frozen", ySplit: 1 }] });
  hoja.columns = [
    { header: "Hembra", key: "hembra", width: 22 },
    { header: "Estado", key: "estado", width: 12 },
    { header: "Partos", key: "partos", width: 8 },
    { header: "IEP promedio (días)", key: "iepPromedio", width: 18 },
    { header: "Últimos días abiertos", key: "ultimosDiasAbiertos", width: 18 },
    { header: "Días abiertos hoy (sin preñez)", key: "diasAbiertosHoy", width: 24 },
    { header: "Servicios en el período", key: "servicios", width: 18 },
    { header: "Preñeces en el período", key: "concepciones", width: 18 },
  ];
  hoja.getRow(1).eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  for (const f of r.filas) hoja.addRow(f);
  return (await libro.xlsx.writeBuffer()) as ArrayBuffer;
}
