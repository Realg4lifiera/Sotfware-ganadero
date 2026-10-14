import "server-only";
import ExcelJS from "exceljs";
import type { InformeProductor } from "@/lib/dominio/informe-productor";
import { ETIQUETA_GRUPO_COSTO } from "@/lib/etiquetas";
import { nombreMes } from "@/lib/fechas";
import type { GrupoCosto } from "@/generated/prisma/enums";
import { ESTILO_ENCABEZADO } from "./libro";

const PESOS = '"$" #,##0';
const PORCENTAJE = "0.0%";

/** Informe del productor del mes en Excel (formato del "Costo de litro" de Colanta). */
export async function generarExcelInforme(
  mes: string,
  finca: string,
  inf: InformeProductor,
): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Campo Verde";
  const hoja = libro.addWorksheet("Informe del productor");
  hoja.columns = [{ width: 38 }, { width: 18 }, { width: 14 }, { width: 12 }];
  hoja.addRow([`Informe del productor · ${finca}`]).font = { bold: true, size: 14 };
  hoja.addRow([nombreMes(mes)]);
  hoja.addRow([]);

  const encabezado = hoja.addRow(["Rubro", "Total", "$/L producido", "% participación"]);
  encabezado.eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  const fila = (
    nombre: string,
    total: number,
    porLitro: number | null,
    participacion: number | null,
    negrita = false,
  ) => {
    const r = hoja.addRow([nombre, total, porLitro, participacion]);
    r.getCell(2).numFmt = PESOS;
    r.getCell(3).numFmt = PESOS;
    r.getCell(4).numFmt = PORCENTAJE;
    if (negrita) r.font = { bold: true };
  };
  for (const g of inf.grupos) {
    fila(ETIQUETA_GRUPO_COSTO[g.grupo as GrupoCosto], g.total, g.porLitro, g.participacion, true);
    for (const r of g.rubros) fila(`   ${r.nombre}`, r.total, r.porLitro, r.participacion);
  }
  fila(
    "Total costos",
    inf.costoTotal,
    inf.costoPorLitroProducido,
    inf.costoTotal > 0 ? 1 : null,
    true,
  );

  hoja.addRow([]);
  const res = hoja.addRow(["Resultado del mes", "Valor"]);
  res.eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  const dato = (nombre: string, valor: number | null, formato: string) => {
    const r = hoja.addRow([nombre, valor]);
    r.getCell(2).numFmt = formato;
  };
  const LITROS = '#,##0.00 "L"';
  dato("Litros producidos", inf.litros.producidos, LITROS);
  dato("Litros vendidos", inf.litros.vendidos, LITROS);
  dato("Consumo interno", inf.litros.consumo, LITROS);
  dato("Precio de venta por litro", inf.precioVenta, '"$" #,##0.00');
  dato("Ingresos por leche", inf.ingresos.leche, PESOS);
  dato("Otros ingresos", inf.ingresos.otros, PESOS);
  dato("Total ingresos", inf.ingresos.total, PESOS);
  dato("Total gastos", inf.costoTotal, PESOS);
  dato("Utilidad", inf.utilidad, PESOS);
  dato("Rentabilidad", inf.rentabilidad, PORCENTAJE);
  dato("Costo / litros producidos", inf.costoPorLitroProducido, '"$" #,##0.00');
  dato("Costo / litros vendidos", inf.costoPorLitroVendido, '"$" #,##0.00');
  dato("Costo lechería", inf.costoLecheria, PESOS);
  dato("Costo lechería / litro producido", inf.costoLecheriaPorLitroProducido, '"$" #,##0.00');
  dato("Costo lechería / litro vendido", inf.costoLecheriaPorLitroVendido, '"$" #,##0.00');
  return libro.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
