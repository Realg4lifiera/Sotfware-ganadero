import "server-only";
import ExcelJS from "exceljs";
import { COLUMNAS_IMPORTACION, MAX_FILAS_IMPORTACION } from "./columnas-animales";
import { normalizar, type Celda, type FilaCruda } from "./validar-animales";
import { ErrorNegocio } from "@/lib/errores";

/** Valor "plano" de una celda de exceljs (fórmulas, texto enriquecido, enlaces…). */
export function valorCelda(v: ExcelJS.CellValue): Celda {
  if (v === null || v === undefined) return null;
  if (v instanceof Date || typeof v !== "object") return v as Celda;
  if ("result" in v) return valorCelda(v.result as ExcelJS.CellValue);
  if ("richText" in v) return v.richText.map((t) => t.text).join("");
  if ("text" in v) return String(v.text);
  if ("error" in v) return null;
  return String(v);
}

const ENCABEZADOS = new Map(COLUMNAS_IMPORTACION.map((c) => [normalizar(c.encabezado), c.clave]));

/** Lee la hoja de animales: busca la fila de encabezados y devuelve las filas con datos. */
export async function leerFilasAnimales(datos: ArrayBuffer): Promise<FilaCruda[]> {
  const libro = new ExcelJS.Workbook();
  try {
    await libro.xlsx.load(datos);
  } catch {
    throw new ErrorNegocio(
      "No se pudo leer el archivo. Debe ser un Excel (.xlsx) como la plantilla.",
    );
  }
  const hoja = libro.getWorksheet("Animales") ?? libro.worksheets[0];
  if (!hoja) throw new ErrorNegocio("El archivo no tiene hojas.");

  // Encabezados: la primera de las 10 primeras filas que contenga "Número / chapeta".
  let filaEncabezados = 0;
  const columnas = new Map<number, string>();
  for (let f = 1; f <= Math.min(10, hoja.rowCount) && !filaEncabezados; f++) {
    hoja.getRow(f).eachCell((celda, col) => {
      const clave = ENCABEZADOS.get(normalizar(valorCelda(celda.value)).replace(/\s*\*$/, ""));
      if (clave) columnas.set(col, clave);
    });
    if ([...columnas.values()].includes("numero")) filaEncabezados = f;
    else columnas.clear();
  }
  if (!filaEncabezados) {
    throw new ErrorNegocio(
      "No se encontró la fila de encabezados. Usa la plantilla descargada (columna «Número / chapeta»).",
    );
  }

  const filas: FilaCruda[] = [];
  for (let f = filaEncabezados + 1; f <= hoja.rowCount; f++) {
    const fila = hoja.getRow(f);
    const celdas: Record<string, Celda> = {};
    let conDatos = false;
    for (const [col, clave] of columnas) {
      const v = valorCelda(fila.getCell(col).value);
      celdas[clave] = typeof v === "string" ? v.trim() : v;
      if (v !== null && v !== "") conDatos = true;
    }
    if (conDatos) filas.push({ fila: f, celdas });
  }
  if (filas.length === 0) throw new ErrorNegocio("El archivo no tiene filas con animales.");
  if (filas.length > MAX_FILAS_IMPORTACION)
    throw new ErrorNegocio(
      `Máximo ${MAX_FILAS_IMPORTACION} animales por archivo (tiene ${filas.length}).`,
    );
  return filas;
}

/** Estilos comunes de los Excel que genera el sistema. */
export const ESTILO_ENCABEZADO: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF465E0C" } },
  alignment: { vertical: "middle", wrapText: true },
};
