import "server-only";
import ExcelJS from "exceljs";
import { nombreMes } from "@/lib/fechas";
import type { IndicadoresProductivos } from "@/lib/servicios/indicadores-productivos";
import { ESTILO_ENCABEZADO } from "./libro";

export async function generarExcelProductivo(
  mes: string,
  i: IndicadoresProductivos,
  carga: { cargaUggHa: number | null; totalUgg: number },
): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Campo Verde";
  const hoja = libro.addWorksheet("Indicadores");
  hoja.columns = [{ width: 36 }, { width: 16 }];
  hoja.addRow([`Indicadores productivos · ${nombreMes(mes)}`]).font = { bold: true, size: 13 };
  hoja.addRow(["Fórmulas validadas con el veterinario."]).font = { italic: true };
  hoja.addRow([]);
  hoja.addRow(["Indicador", "Valor"]).eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  const fila = (n: string, v: number | null, fmt = "#,##0.0") => {
    const r = hoja.addRow([n, v]);
    r.getCell(2).numFmt = fmt;
  };
  const pesos = '"$" #,##0';
  fila("Litros producidos", i.litrosProducidos);
  fila("Vacas-día en producción", i.vacaDias, "#,##0");
  fila("Litros por vaca/día", i.litrosVacaDia);
  fila("Litros por hectárea (mes)", i.litrosHa);
  fila("Carga animal actual (UGG/ha)", carga.cargaUggHa, "#,##0.00");
  fila("Unidades gran ganado actuales (UGG)", carga.totalUgg);
  fila("Kilos ganados (cría, levante y ceba)", i.kilosGanados);
  fila("Costos de cría, levante y ceba", i.costoCentrosCarne, pesos);
  fila("Gastos generales asignados a carne", i.generalesCarne, pesos);
  fila("Costo por kilo ganado", i.costoKiloGanado, pesos);
  fila("Animales-día", i.animalDias, "#,##0");
  fila("Costo total del mes", i.costoTotal, pesos);
  fila("Costo por animal/día", i.costoAnimalDia, pesos);

  const g = libro.addWorksheet("Ganancia por lote");
  g.columns = [
    { header: "Lote", key: "nombre", width: 26 },
    { header: "Animales pesados", key: "animales", width: 16 },
    { header: "Kilos ganados", key: "kilos", width: 14 },
    { header: "GDP (g/día)", key: "gdp", width: 12 },
  ];
  g.getRow(1).eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  for (const l of i.ganancia) g.addRow(l);
  return (await libro.xlsx.writeBuffer()) as ArrayBuffer;
}
