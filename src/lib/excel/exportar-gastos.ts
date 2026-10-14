import "server-only";
import ExcelJS from "exceljs";
import { prismaBase } from "@/lib/db";
import { costoDeCompra } from "@/lib/dominio/compras";
import { ETIQUETA_ORIGEN_COMPRA } from "@/lib/etiquetas";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { ESTILO_ENCABEZADO } from "./libro";

/** Compras y gastos de un rango de fechas (hasta exclusivo). */
export async function generarExcelGastos(desde: Date, hasta: Date): Promise<ArrayBuffer> {
  const [gastos, config] = await Promise.all([
    prismaBase.gasto.findMany({
      where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
      orderBy: [{ fecha: "asc" }, { createdAt: "asc" }],
      include: {
        categoria: { include: { rubro: true } },
        centroCosto: true,
        proveedor: true,
        insumo: true,
        animal: { select: { numero: true } },
        lote: { select: { nombre: true } },
      },
    }),
    obtenerConfiguracionFinca(),
  ]);
  const libro = new ExcelJS.Workbook();
  libro.creator = "Campo Verde";
  const hoja = libro.addWorksheet("Compras y gastos", { views: [{ state: "frozen", ySplit: 1 }] });
  const pesos = { numFmt: '"$" #,##0' };
  hoja.columns = [
    { header: "Fecha", key: "fecha", width: 12, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Artículo o concepto", key: "descripcion", width: 34 },
    { header: "Proveedor", key: "proveedor", width: 24 },
    { header: "NIT", key: "nit", width: 14 },
    { header: "Categoría", key: "categoria", width: 28 },
    { header: "Rubro", key: "rubro", width: 26 },
    { header: "Centro de costo", key: "centro", width: 18 },
    { header: "Presentación", key: "presentacion", width: 16 },
    { header: "Marca", key: "marca", width: 14 },
    { header: "Cantidad", key: "cantidad", width: 10 },
    { header: "Valor unitario", key: "valorUnitario", width: 14, style: pesos },
    { header: "Descuento", key: "descuento", width: 12, style: pesos },
    { header: "% IVA", key: "iva", width: 7 },
    { header: "Valor IVA", key: "valorIva", width: 12, style: pesos },
    { header: "Total pagado", key: "total", width: 14, style: pesos },
    { header: "Costo", key: "costo", width: 14, style: pesos },
    { header: "Origen", key: "origen", width: 22 },
    { header: "Factura", key: "factura", width: 14 },
    { header: "Asignado a", key: "asignacion", width: 18 },
    { header: "Notas", key: "notas", width: 30 },
  ];
  hoja.getRow(1).height = 28;
  hoja.getRow(1).eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  for (const g of gastos) {
    hoja.addRow({
      fecha: g.fecha,
      descripcion: g.descripcion,
      proveedor: g.proveedor?.nombre ?? "",
      nit: g.proveedor?.nit ?? "",
      categoria: g.categoria.nombre,
      rubro: g.categoria.rubro.nombre,
      centro: g.centroCosto.nombre,
      presentacion: g.presentacion ?? "",
      marca: g.marca ?? "",
      cantidad: Number(g.cantidad),
      valorUnitario: Number(g.valorUnitario),
      descuento: Number(g.descuento),
      iva: Number(g.ivaPorcentaje),
      valorIva: Number(g.valorIva),
      total: Number(g.valorTotal),
      costo: costoDeCompra(
        { valorTotal: Number(g.valorTotal), valorIva: Number(g.valorIva) },
        config.costos.ivaEsCosto,
      ),
      origen: ETIQUETA_ORIGEN_COMPRA[g.origen],
      factura: g.numeroFactura ?? "",
      asignacion: g.animal ? `Animal ${g.animal.numero}` : (g.lote?.nombre ?? ""),
      notas: g.notas ?? "",
    });
  }
  const ultima = hoja.rowCount;
  if (gastos.length) {
    const total = hoja.addRow({ descripcion: "Total" });
    total.font = { bold: true };
    for (const col of ["descuento", "valorIva", "total", "costo"]) {
      const letra = hoja.getColumn(col).letter;
      total.getCell(col).value = { formula: `SUM(${letra}2:${letra}${ultima})` };
    }
  }
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: hoja.columnCount } };
  return (await libro.xlsx.writeBuffer()) as ArrayBuffer;
}
