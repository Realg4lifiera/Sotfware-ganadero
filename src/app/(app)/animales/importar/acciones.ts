"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import { ErrorNegocio, ErrorPermiso, type ResultadoAccion } from "@/lib/errores";
import { cargarCatalogosImportacion } from "@/lib/excel/catalogos-importacion";
import { leerFilasAnimales } from "@/lib/excel/libro";
import { ordenarParaInsertar, validarFilas } from "@/lib/excel/validar-animales";
import { ETIQUETA_ESTADO_REPRODUCTIVO, ETIQUETA_SEXO } from "@/lib/etiquetas";
import { puede } from "@/lib/permisos";
import { insertarAnimal } from "@/lib/servicios/animales";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { traducirError } from "@/lib/traducir-error";

const TAMANO_MAXIMO = 5 * 1024 * 1024;

export interface FilaVistaPrevia {
  fila: number;
  numero: string;
  nombre: string;
  resumen: string;
  errores: string[];
}

export interface VistaPrevia {
  filas: FilaVistaPrevia[];
  validas: number;
  conError: number;
}

async function leerArchivo(formData: FormData) {
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0)
    throw new ErrorNegocio("Selecciona el archivo de Excel.");
  if (archivo.size > TAMANO_MAXIMO)
    throw new ErrorNegocio("El archivo no puede pesar más de 5 MB.");
  if (!archivo.name.toLowerCase().endsWith(".xlsx"))
    throw new ErrorNegocio("El archivo debe ser de Excel (.xlsx). Usa la plantilla.");
  const filas = await leerFilasAnimales(await archivo.arrayBuffer());
  return validarFilas(filas, await cargarCatalogosImportacion());
}

/** Lee y valida el archivo sin guardar nada. */
export async function previsualizarImportacion(
  formData: FormData,
): Promise<ResultadoAccion<VistaPrevia>> {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario || !puede(usuario.rol, "animal:importar")) throw new ErrorPermiso();
    const r = await leerArchivo(formData);
    return {
      ok: true,
      datos: {
        validas: r.validas,
        conError: r.conError,
        filas: r.filas.map((f) => ({
          fila: f.fila,
          numero: f.numero,
          nombre: f.nombre,
          errores: f.errores,
          resumen: f.animal
            ? [
                ETIQUETA_SEXO[f.animal.sexo],
                f.animal.estadoReproductivo &&
                  ETIQUETA_ESTADO_REPRODUCTIVO[f.animal.estadoReproductivo],
                f.madreEnArchivo && `madre ${f.madreEnArchivo} (en el archivo)`,
              ]
                .filter(Boolean)
                .join(" · ")
            : "",
        })),
      },
    };
  } catch (e) {
    return traducirError(e);
  }
}

/**
 * Importa las filas válidas en una sola transacción (todas o ninguna). El archivo se
 * vuelve a leer y validar en el servidor: no se confía en la vista previa.
 */
export async function confirmarImportacion(
  formData: FormData,
): Promise<ResultadoAccion<{ importados: number; omitidos: number }>> {
  const r = await accion(
    "animal:importar",
    async ({ tx }) => {
      const validacion = await leerArchivo(formData);
      const validas = validacion.filas.filter((f) => f.animal);
      if (validas.length === 0) throw new ErrorNegocio("No hay filas válidas para importar.");
      const ids = new Map<string, string>();
      for (const f of ordenarParaInsertar(validas)) {
        const madreId = f.madreEnArchivo ? ids.get(f.madreEnArchivo)! : f.animal!.madreId;
        ids.set(f.numero, await insertarAnimal(tx, { ...f.animal!, madreId }));
      }
      return { importados: validas.length, omitidos: validacion.conError };
    },
    { timeoutMs: 240_000 },
  );
  if (r.ok) {
    revalidatePath("/animales");
    revalidatePath("/tablero");
  }
  return r;
}
