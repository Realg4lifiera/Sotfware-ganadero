import "server-only";
import ExcelJS from "exceljs";
import { CATEGORIAS, ETIQUETA_CATEGORIA } from "@/lib/dominio/categoria";
import { nombreMes } from "@/lib/fechas";
import type { ReporteInventario } from "@/lib/servicios/reporte-inventario";
import { ESTILO_ENCABEZADO } from "./libro";

export async function generarExcelInventario(
  mes: string,
  r: ReporteInventario,
): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Campo Verde";
  const encabezar = (h: ExcelJS.Worksheet) =>
    h.getRow(1).eachCell((c) => (c.style = ESTILO_ENCABEZADO));

  const rot = libro.addWorksheet("Rotación");
  rot.columns = [
    { header: `Rotación · ${nombreMes(mes)}`, width: 34 },
    { header: "Animales", width: 12 },
  ];
  encabezar(rot);
  const x = r.rotacion;
  for (const [n, v] of [
    ["Inventario al inicio del mes", x.inicial],
    ["+ Nacimientos", x.nacimientos],
    ["+ Compras", x.compras],
    ["− Descartes", x.descartes],
    ["− Ventas", x.ventas],
    ["− Muertes", x.muertes],
    ["Inventario al final del mes", x.final],
  ] as const)
    rot.addRow([n, v]);

  const comp = libro.addWorksheet("Composición actual");
  comp.columns = [
    { header: "Categoría", width: 26 },
    { header: "Cantidad", width: 10 },
    { header: "% actual", width: 10, style: { numFmt: "0%" } },
    { header: "% ideal", width: 10, style: { numFmt: "0%" } },
  ];
  encabezar(comp);
  for (const f of [...r.composicion.hato, ...r.composicion.otras])
    comp.addRow([f.etiqueta, f.cantidad, f.porcentajeReal, f.porcentajeIdeal]);

  for (const [titulo, filas] of [
    ["Por lote", r.porLote],
    ["Por potrero", r.porPotrero],
  ] as const) {
    const h = libro.addWorksheet(titulo);
    h.columns = [
      { header: titulo.replace("Por ", ""), key: "nombre", width: 26 },
      ...CATEGORIAS.map((c) => ({ header: ETIQUETA_CATEGORIA[c], key: c, width: 14 })),
      { header: "Total", key: "total", width: 10 },
    ];
    encabezar(h);
    for (const f of filas) h.addRow(f);
  }

  const an = libro.addWorksheet("Animales activos", { views: [{ state: "frozen", ySplit: 1 }] });
  an.columns = [
    { header: "Número", key: "numero", width: 12 },
    { header: "Nombre", key: "nombre", width: 18 },
    { header: "Categoría", key: "categoria", width: 24 },
    { header: "Lote", key: "lote", width: 24 },
    { header: "Potrero", key: "potrero", width: 18 },
  ];
  encabezar(an);
  for (const a of r.animales) an.addRow(a);
  return (await libro.xlsx.writeBuffer()) as ArrayBuffer;
}
