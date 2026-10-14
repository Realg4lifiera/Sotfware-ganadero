/**
 * Validación de la importación de animales, fila por fila, sin acceso a la BD: recibe
 * los catálogos ya cargados. Así se prueba con datos de ejemplo y se usa igual en la
 * vista previa y en la confirmación.
 */
import { formatoFecha } from "@/lib/fechas";
import { esquemaCrearAnimal, type AnimalNuevo } from "@/lib/validaciones/animales";
import { ETIQUETA_ESPECIE, ETIQUETA_ESTADO_REPRODUCTIVO, ETIQUETA_SEXO } from "@/lib/etiquetas";
import { COLUMNAS_IMPORTACION, VALORES_ORIGEN } from "./columnas-animales";

export type Celda = string | number | boolean | Date | null | undefined;

export interface FilaCruda {
  /** Número de fila en la hoja de Excel (para los mensajes). */
  fila: number;
  celdas: Record<string, Celda>;
}

export interface AnimalExistente {
  id: string;
  sexo: "HEMBRA" | "MACHO";
  especie: "BOVINO" | "EQUINO" | "OTRA";
  fechaNacimiento: Date | null;
}

export interface CatalogosImportacion {
  /** Claves normalizadas (ver `normalizar`). */
  razas: Map<string, string>;
  lotes: Map<string, string>;
  potreros: Map<string, string>;
  /** Por nombre y por código; null si el nombre es ambiguo. */
  toros: Map<string, string | null>;
  /** Todos los números ya usados (incluye eliminados) → datos del animal. */
  animales: Map<string, AnimalExistente>;
}

export interface FilaValidada {
  fila: number;
  numero: string;
  nombre: string;
  errores: string[];
  /** Solo si no hay errores. */
  animal?: AnimalNuevo;
  /** Número de la madre cuando está en el mismo archivo. */
  madreEnArchivo?: string;
}

export interface ResultadoValidacion {
  filas: FilaValidada[];
  validas: number;
  conError: number;
}

// ── Utilidades de celdas ─────────────────────────────────────────────────────

export function normalizar(texto: unknown): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function texto(c: Celda): string {
  if (c === null || c === undefined) return "";
  if (c instanceof Date) return fechaCeldaISO(c) ?? "";
  return String(c).trim();
}

/** Excel guarda fechas como número de días desde 1899-12-30. */
function desdeSerialExcel(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86_400_000));
}

function isoValido(a: number, m: number, d: number): string | null {
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return null;
  return f.toISOString().slice(0, 10);
}

/** Convierte una celda de fecha (Date, número de Excel o texto) a "AAAA-MM-DD". */
export function fechaCeldaISO(c: Celda): string | null | undefined {
  if (c === null || c === undefined || c === "") return undefined; // vacía
  if (c instanceof Date) {
    if (Number.isNaN(c.getTime())) return null;
    // exceljs entrega las fechas a medianoche UTC; si trae hora, se redondea al día.
    return new Date(c.getTime() + 12 * 3_600_000).toISOString().slice(0, 10);
  }
  if (typeof c === "number") return c > 0 && c < 100000 ? fechaCeldaISO(desdeSerialExcel(c)) : null;
  const s = String(c).trim();
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(s);
  if (m) {
    const anio = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return isoValido(anio, Number(m[2]), Number(m[1]));
  }
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return isoValido(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

/** "Sí"/"No" (también si, s, x, 1, true…). Vacía = false. null si no se entiende. */
export function siNo(c: Celda): boolean | null {
  if (typeof c === "boolean") return c;
  const s = normalizar(c);
  if (["", "no", "n", "0", "false", "falso"].includes(s)) return false;
  if (["si", "s", "x", "1", "true", "verdadero"].includes(s)) return true;
  return null;
}

function buscarEtiqueta<T extends string>(
  mapa: Record<T, string>,
  valor: Celda,
): T | null | undefined {
  const s = normalizar(valor);
  if (!s) return undefined;
  for (const [clave, etiqueta] of Object.entries(mapa) as [T, string][]) {
    if (normalizar(etiqueta) === s || normalizar(clave) === s) return clave;
  }
  return null;
}

const ETIQUETA_COLUMNA = Object.fromEntries(
  COLUMNAS_IMPORTACION.map((c) => [c.clave, c.encabezado]),
);
/** Campo del esquema → columna del Excel. */
const COLUMNA_DE_CAMPO: Record<string, string> = {
  razaId: "raza",
  madreId: "madre",
  padreId: "padre",
  loteId: "lote",
  potreroId: "potrero",
};
const columna = (campo: string) => ETIQUETA_COLUMNA[COLUMNA_DE_CAMPO[campo] ?? campo] ?? campo;

// ── Validación ───────────────────────────────────────────────────────────────

export function validarFilas(filas: FilaCruda[], cat: CatalogosImportacion): ResultadoValidacion {
  const primeraFilaDe = new Map<string, number>();
  const resultado: FilaValidada[] = filas.map((f) => validarFila(f, cat, primeraFilaDe));
  const porNumero = new Map(resultado.map((r) => [r.numero, r]));

  // Madre que no está ni en la finca ni en el archivo (se reporta aunque la fila tenga
  // otros errores, para corregir todo de una vez).
  for (const r of resultado) {
    if (r.madreEnArchivo && !porNumero.has(r.madreEnArchivo)) {
      r.errores.push(
        `Número de la madre: ${r.madreEnArchivo} no existe en la finca ni en este archivo.`,
      );
      r.animal = undefined;
    }
  }

  // Madres dentro del archivo: deben ser filas válidas, hembras bovinas y nacidas antes.
  // Se repite hasta que no cambie nada (una madre con error invalida a sus crías).
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const r of resultado) {
      if (!r.animal || !r.madreEnArchivo) continue;
      const madre = porNumero.get(r.madreEnArchivo);
      let error: string | null = null;
      if (!madre)
        error = `Número de la madre: ${r.madreEnArchivo} no existe en la finca ni en este archivo.`;
      else if (!madre.animal)
        error = `La madre ${r.madreEnArchivo} (fila ${madre.fila}) tiene errores.`;
      else if (madre.animal.sexo !== "HEMBRA" || madre.animal.especie !== "BOVINO")
        error = `La madre ${r.madreEnArchivo} (fila ${madre.fila}) no es una hembra bovina.`;
      else if (
        madre.animal.fechaNacimiento &&
        r.animal.fechaNacimiento &&
        madre.animal.fechaNacimiento >= r.animal.fechaNacimiento
      )
        error = `La madre ${r.madreEnArchivo} debe haber nacido antes que la cría.`;
      if (error) {
        r.errores.push(error);
        r.animal = undefined;
        cambio = true;
      }
    }
  }
  const validas = resultado.filter((r) => r.animal).length;
  return { filas: resultado, validas, conError: resultado.length - validas };
}

function validarFila(
  { fila, celdas }: FilaCruda,
  cat: CatalogosImportacion,
  primeraFilaDe: Map<string, number>,
): FilaValidada {
  const errores: string[] = [];
  const err = (col: string, msj: string) => errores.push(`${ETIQUETA_COLUMNA[col] ?? col}: ${msj}`);
  const numero = texto(celdas.numero);
  const nombre = texto(celdas.nombre);

  // Duplicados en el archivo y en la finca.
  if (numero) {
    const n = normalizar(numero);
    const previa = primeraFilaDe.get(n);
    if (previa) err("numero", `está repetido (también en la fila ${previa}).`);
    else primeraFilaDe.set(n, fila);
    if (cat.animales.has(numero)) err("numero", `ya existe un animal con el número ${numero}.`);
  }

  // Listas cerradas.
  const especie = celdas.especie ? buscarEtiqueta(ETIQUETA_ESPECIE, celdas.especie) : "BOVINO";
  if (especie === null)
    err("especie", `«${texto(celdas.especie)}» no es válido (Bovino, Equino u Otra).`);
  const sexo = buscarEtiqueta(ETIQUETA_SEXO, celdas.sexo);
  if (sexo === null) err("sexo", `«${texto(celdas.sexo)}» no es válido (Hembra o Macho).`);
  const origen = buscarEtiqueta(VALORES_ORIGEN as Record<string, string>, celdas.origen);
  const origenEnum = origen ? VALORES_ORIGEN[origen as keyof typeof VALORES_ORIGEN] : origen;
  if (origen === null) err("origen", `«${texto(celdas.origen)}» no es válido (Nacido o Comprado).`);
  const estado = buscarEtiqueta(ETIQUETA_ESTADO_REPRODUCTIVO, celdas.estadoReproductivo);
  if (estado === null)
    err("estadoReproductivo", `«${texto(celdas.estadoReproductivo)}» no es válido.`);

  const estimada = siNo(celdas.fechaNacimientoEstimada);
  if (estimada === null) err("fechaNacimientoEstimada", "escribe Sí o No.");
  const enProduccion = siNo(celdas.enProduccion);
  if (enProduccion === null) err("enProduccion", "escribe Sí o No.");

  // Fechas.
  const nacimiento = fechaCeldaISO(celdas.fechaNacimiento);
  if (nacimiento === null) err("fechaNacimiento", "fecha no válida (usa dd/mm/aaaa).");
  let ingreso = fechaCeldaISO(celdas.fechaIngreso);
  if (ingreso === null) err("fechaIngreso", "fecha no válida (usa dd/mm/aaaa).");
  if (origenEnum === "NACIDO" && !ingreso && nacimiento) ingreso = nacimiento;

  // Catálogos.
  const buscar = (mapa: Map<string, string>, col: string, catalogo: string) => {
    const v = texto(celdas[col]);
    if (!v) return "";
    const id = mapa.get(normalizar(v));
    if (!id) err(col, `«${v}» no existe en ${catalogo}.`);
    return id ?? "";
  };
  const razaId = buscar(cat.razas, "raza", "Razas");
  const loteId = buscar(cat.lotes, "lote", "Lotes");
  const potreroId = buscar(cat.potreros, "potrero", "Potreros");
  let padreId = "";
  const padre = texto(celdas.padre);
  if (padre) {
    const id = cat.toros.get(normalizar(padre));
    if (id === undefined) err("padre", `«${padre}» no existe en Toros.`);
    else if (id === null) err("padre", `hay varios toros llamados «${padre}»; usa el código.`);
    else padreId = id;
  }

  // Madre: registrada en la finca o en otra fila del archivo.
  let madreId = "";
  let madreEnArchivo: string | undefined;
  const madre = texto(celdas.madre);
  if (madre) {
    if (madre === numero) err("madre", "un animal no puede ser su propia madre.");
    const existente = cat.animales.get(madre);
    if (existente) {
      if (existente.sexo !== "HEMBRA") err("madre", `el animal ${madre} no es hembra.`);
      else if (
        existente.fechaNacimiento &&
        nacimiento &&
        existente.fechaNacimiento.toISOString().slice(0, 10) >= nacimiento
      )
        err(
          "madre",
          `la madre ${madre} nació el ${formatoFecha(existente.fechaNacimiento)}, después que la cría.`,
        );
      else madreId = existente.id;
    } else {
      madreEnArchivo = madre; // se valida después de leer todas las filas
    }
  }

  // Estado reproductivo por defecto: hembra bovina sin partos y sin estado → novilla.
  const partosTexto = texto(celdas.numeroPartos);
  const hembraBovina = sexo === "HEMBRA" && especie === "BOVINO";
  const estadoFinal =
    estado ?? (hembraBovina && (!partosTexto || partosTexto === "0") ? "NOVILLA" : "");

  const valores = {
    numero,
    nombre,
    especie: especie ?? "",
    sexo: sexo ?? "",
    razaId,
    fechaNacimiento: nacimiento ?? "",
    fechaNacimientoEstimada: estimada ?? false,
    origen: origenEnum ?? "",
    fechaIngreso: ingreso ?? "",
    pesoNacimientoKg: texto(celdas.pesoNacimientoKg),
    madreId,
    padreId,
    loteId,
    potreroId,
    observaciones: texto(celdas.observaciones),
    // A un macho con estado se le deja para que el esquema reporte el error.
    estadoReproductivo: hembraBovina ? estadoFinal : (estado ?? ""),
    numeroPartos: partosTexto,
    enProduccion: enProduccion ?? false,
    valorCompra: texto(celdas.valorCompra),
  };

  const r = esquemaCrearAnimal.safeParse(valores);
  if (!r.success) {
    const vistos = new Set(errores.map((e) => e.split(":")[0]));
    for (const issue of r.error.issues) {
      const campo = String(issue.path[0] ?? "");
      const col = columna(campo);
      if (vistos.has(col)) continue; // ya tiene un error más específico
      vistos.add(col);
      errores.push(`${col}: ${issue.message}`);
    }
  }

  if (errores.length > 0 || !r.success) return { fila, numero, nombre, errores, madreEnArchivo };
  const d = r.data as unknown as AnimalNuevo & { numeroPartos: number | null };
  return {
    fila,
    numero,
    nombre,
    errores,
    animal: { ...d, numeroPartos: d.numeroPartos ?? 0, madreId: madreId || null },
    madreEnArchivo,
  };
}

/** Orden de inserción: las madres del archivo antes que sus crías. */
export function ordenarParaInsertar(filas: FilaValidada[]): FilaValidada[] {
  const porNumero = new Map(filas.map((f) => [f.numero, f]));
  const salida: FilaValidada[] = [];
  const visitado = new Set<string>();
  const visitar = (f: FilaValidada, camino: Set<string>) => {
    if (visitado.has(f.numero) || camino.has(f.numero)) return;
    camino.add(f.numero);
    const madre = f.madreEnArchivo ? porNumero.get(f.madreEnArchivo) : undefined;
    if (madre) visitar(madre, camino);
    visitado.add(f.numero);
    salida.push(f);
  };
  for (const f of filas) visitar(f, new Set());
  return salida;
}
