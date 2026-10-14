import "server-only";
import ExcelJS from "exceljs";
import { prismaBase } from "@/lib/db";
import { COLUMNAS_IMPORTACION, LISTAS_FIJAS, type ListaColumna } from "./columnas-animales";
import { ESTILO_ENCABEZADO } from "./libro";

/** Plantilla de importación con listas desplegables tomadas de los catálogos. */
export async function generarPlantillaAnimales(): Promise<ArrayBuffer> {
  const [razas, lotes, potreros, toros] = await Promise.all([
    prismaBase.raza.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prismaBase.lote.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prismaBase.potrero.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
    prismaBase.toro.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);
  const listas: Record<ListaColumna, string[]> = {
    ...(LISTAS_FIJAS as Record<ListaColumna, string[]>),
    razas: razas.map((r) => r.nombre),
    lotes: lotes.map((l) => l.nombre),
    potreros: potreros.map((p) => p.nombre),
    toros: toros.map((t) => t.codigo ?? t.nombre),
  };

  const libro = new ExcelJS.Workbook();
  libro.creator = "Campo Verde";
  libro.created = new Date();

  // Hoja de listas (oculta) para las validaciones de datos.
  const hojaListas = libro.addWorksheet("Listas", { state: "veryHidden" });
  const rangos: Partial<Record<ListaColumna, string>> = {};
  (Object.keys(listas) as ListaColumna[]).forEach((clave, i) => {
    const col = hojaListas.getColumn(i + 1);
    const valores = listas[clave];
    col.values = [clave, ...valores];
    const letra = col.letter;
    if (valores.length) rangos[clave] = `Listas!$${letra}$2:$${letra}$${valores.length + 1}`;
  });

  const hoja = libro.addWorksheet("Animales", { views: [{ state: "frozen", ySplit: 1 }] });
  hoja.columns = COLUMNAS_IMPORTACION.map((c) => ({
    header: c.requerido ? `${c.encabezado} *` : c.encabezado,
    key: c.clave,
    width: c.ancho,
  }));
  hoja.getRow(1).height = 32;
  hoja.getRow(1).eachCell((celda, col) => {
    celda.style = ESTILO_ENCABEZADO;
    celda.note = COLUMNAS_IMPORTACION[col - 1].ayuda;
  });
  // Fila de ejemplo (se puede borrar).
  hoja.addRow(Object.fromEntries(COLUMNAS_IMPORTACION.map((c) => [c.clave, c.ejemplo])));
  hoja.getRow(2).font = { italic: true, color: { argb: "FF6B7280" } };

  COLUMNAS_IMPORTACION.forEach((c, i) => {
    const col = hoja.getColumn(i + 1);
    if (c.tipo === "fecha") col.numFmt = "dd/mm/yyyy";
    if (c.clave === "valorCompra") col.numFmt = "#,##0";
    for (let fila = 2; fila <= 1001; fila++) {
      const celda = hoja.getCell(fila, i + 1);
      if (c.lista && rangos[c.lista]) {
        celda.dataValidation = {
          type: "list",
          allowBlank: !c.requerido,
          formulae: [rangos[c.lista]!],
          showErrorMessage: c.lista !== "toros", // el toro también se puede escribir por nombre
          errorTitle: c.encabezado,
          error: "Elige un valor de la lista.",
        };
      } else if (c.tipo === "fecha") {
        celda.dataValidation = {
          type: "date",
          operator: "greaterThan",
          allowBlank: true,
          formulae: [new Date(Date.UTC(1990, 0, 1))],
          showErrorMessage: true,
          error: "Escribe una fecha (dd/mm/aaaa).",
        };
      }
    }
  });

  const instrucciones = libro.addWorksheet("Instrucciones");
  instrucciones.columns = [
    { header: "Columna", key: "col", width: 24 },
    { header: "Obligatoria", key: "req", width: 12 },
    { header: "Cómo llenarla", key: "ayuda", width: 80 },
  ];
  instrucciones.getRow(1).eachCell((c) => (c.style = ESTILO_ENCABEZADO));
  for (const c of COLUMNAS_IMPORTACION) {
    instrucciones.addRow({ col: c.encabezado, req: c.requerido ? "Sí" : "", ayuda: c.ayuda });
  }
  instrucciones.addRow({});
  instrucciones.addRow({
    col: "Notas",
    ayuda:
      "Llena la hoja «Animales», una fila por animal (borra la fila de ejemplo). Las madres pueden estar en el mismo archivo. Al subirlo verás una vista previa con los errores de cada fila antes de confirmar.",
  });
  instrucciones.getColumn("ayuda").alignment = { wrapText: true, vertical: "top" };

  return (await libro.xlsx.writeBuffer()) as ArrayBuffer;
}
