import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { ErrorNegocio } from "@/lib/errores";
import { formatoFecha } from "@/lib/fechas";
import { formatoCOP, formatoNumero } from "@/lib/formato";
import {
  esquemaDesdeCampos,
  valoresDesdeRegistro,
  type Opcion,
  type ValoresFormulario,
} from "@/lib/formularios/campos";
import { catalogoPorClave, type DefCatalogo } from "./definiciones";

/** Configuración de servidor de cada catálogo. */
interface ServidorCatalogo {
  /** Nombre del delegado de Prisma (p. ej. "potrero"). */
  modelo: string;
  /** Relaciones que impiden eliminar si tienen registros. */
  bloqueantes: string[];
  /** El nombre es único en la BD: al eliminar se renombra para liberarlo. */
  nombreUnico: boolean;
  orden: Record<string, "asc" | "desc">[];
  validar?: (datos: Record<string, unknown>, tx: Tx, id: string | null) => Promise<void>;
}

const SERVIDOR: Record<string, ServidorCatalogo> = {
  potreros: {
    modelo: "potrero",
    bloqueantes: ["animales", "ocupaciones"],
    nombreUnico: true,
    orden: [{ nombre: "asc" }],
  },
  lotes: {
    modelo: "lote",
    bloqueantes: ["animales", "ordenos", "pesajes", "ocupaciones", "gastos"],
    nombreUnico: true,
    orden: [{ nombre: "asc" }],
  },
  razas: {
    modelo: "raza",
    bloqueantes: ["animales", "toros", "pajillas"],
    nombreUnico: true,
    orden: [{ nombre: "asc" }],
  },
  toros: {
    modelo: "toro",
    bloqueantes: ["hijos", "pajillas", "servicios", "partos"],
    nombreUnico: false,
    orden: [{ propio: "desc" }, { nombre: "asc" }],
    async validar(datos, tx, id) {
      if (!datos.animalId) return;
      if (!datos.propio) {
        throw new ErrorNegocio("Revisa los datos.", {
          animalId: "Solo un toro propio puede vincularse a un animal del hato.",
        });
      }
      const animal = await tx.animal.findFirst({
        where: { id: String(datos.animalId), deletedAt: null },
        select: { sexo: true, especie: true, toro: { select: { id: true } } },
      });
      if (!animal || animal.sexo !== "MACHO" || animal.especie !== "BOVINO") {
        throw new ErrorNegocio("Revisa los datos.", {
          animalId: "Debe ser un macho bovino del hato.",
        });
      }
      if (animal.toro && animal.toro.id !== id) {
        throw new ErrorNegocio("Revisa los datos.", {
          animalId: "Ese animal ya está registrado como otro toro.",
        });
      }
    },
  },
  "centros-costo": {
    modelo: "centroCosto",
    bloqueantes: [
      "gastos",
      "pagosNomina",
      "costosIndirectos",
      "detallesProrrateo",
      "activos",
      "ingresos",
      "presupuestos",
    ],
    nombreUnico: true,
    orden: [{ nombre: "asc" }],
  },
  rubros: {
    modelo: "rubroCosto",
    bloqueantes: ["categorias"],
    nombreUnico: true,
    orden: [{ grupo: "asc" }, { orden: "asc" }],
  },
  "categorias-gasto": {
    modelo: "categoriaGasto",
    bloqueantes: ["gastos", "costosIndirectos", "presupuestos"],
    nombreUnico: true,
    orden: [{ nombre: "asc" }],
  },
  insumos: {
    modelo: "insumo",
    bloqueantes: ["gastos", "suministros", "eventosSanitarios"],
    nombreUnico: true,
    orden: [{ tipo: "asc" }, { nombre: "asc" }],
  },
  proveedores: {
    modelo: "proveedor",
    bloqueantes: ["gastos", "costosIndirectos", "pajillas", "movimientos"],
    nombreUnico: true,
    orden: [{ nombre: "asc" }],
  },
  compradores: {
    modelo: "comprador",
    bloqueantes: ["ingresos", "entregas", "movimientos"],
    nombreUnico: true,
    orden: [{ nombre: "asc" }],
  },
  trabajadores: {
    modelo: "trabajador",
    bloqueantes: ["pagos"],
    nombreUnico: false,
    orden: [{ activo: "desc" }, { nombre: "asc" }],
  },
};

/** Acceso genérico a un delegado de Prisma (tipado mínimo para el CRUD de catálogos). */
interface Delegado {
  findMany(args: object): Promise<Record<string, unknown>[]>;
  findFirst(args: object): Promise<Record<string, unknown> | null>;
  create(args: object): Promise<Record<string, unknown>>;
  update(args: object): Promise<Record<string, unknown>>;
}
function delegado(cliente: unknown, modelo: string): Delegado {
  return (cliente as Record<string, Delegado>)[modelo];
}

export function obtenerCatalogo(clave: string): { def: DefCatalogo; srv: ServidorCatalogo } | null {
  const def = catalogoPorClave(clave);
  const srv = SERVIDOR[clave];
  return def && srv ? { def, srv } : null;
}

/** Opciones dinámicas de los selects (cargadas en el servidor). */
const CARGADORES: Record<string, () => Promise<Opcion[]>> = {
  async razas() {
    const r = await prismaBase.raza.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: "asc" },
    });
    return r.map((x) => ({
      valor: x.id,
      etiqueta: x.activo ? x.nombre : `${x.nombre} (inactiva)`,
    }));
  },
  async rubros() {
    const r = await prismaBase.rubroCosto.findMany({
      where: { deletedAt: null },
      orderBy: [{ grupo: "asc" }, { orden: "asc" }],
    });
    return r.map((x) => ({ valor: x.id, etiqueta: x.nombre }));
  },
  async machos() {
    const r = await prismaBase.animal.findMany({
      where: { deletedAt: null, sexo: "MACHO", especie: "BOVINO", estado: "ACTIVO" },
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, nombre: true },
    });
    return r.map((x) => ({
      valor: x.id,
      etiqueta: x.nombre ? `${x.numero} · ${x.nombre}` : x.numero,
    }));
  },
};

export async function cargarOpciones(def: DefCatalogo): Promise<Record<string, Opcion[]>> {
  const claves = [...new Set(def.campos.map((c) => c.opcionesDe).filter((x): x is string => !!x))];
  const pares = await Promise.all(claves.map(async (k) => [k, await CARGADORES[k]()] as const));
  return Object.fromEntries(pares);
}

export interface FilaCatalogo {
  id: string;
  activo: boolean;
  valores: ValoresFormulario;
  celdas: Record<string, string>;
}

/** Registros del catálogo listos para la tabla y para editar. */
export async function listarCatalogo(
  def: DefCatalogo,
  srv: ServidorCatalogo,
  opcionesDinamicas: Record<string, Opcion[]>,
): Promise<FilaCatalogo[]> {
  const registros = await delegado(prismaBase, srv.modelo).findMany({
    where: { deletedAt: null },
    orderBy: srv.orden,
  });
  return registros.map((r) => {
    const celdas: Record<string, string> = {};
    for (const c of def.campos) {
      const v = r[c.nombre];
      if (v === null || v === undefined || v === "") {
        celdas[c.nombre] = c.tipo === "booleano" ? "No" : "—";
        continue;
      }
      switch (c.tipo) {
        case "booleano":
          celdas[c.nombre] = v ? "Sí" : "No";
          break;
        case "decimal":
          celdas[c.nombre] =
            c.sufijo === "COP"
              ? formatoCOP(v as number)
              : `${formatoNumero(v as number)}${c.sufijo ? ` ${c.sufijo}` : ""}`;
          break;
        case "fecha":
          celdas[c.nombre] = formatoFecha(v as Date);
          break;
        case "opcion": {
          const lista = c.opciones ?? opcionesDinamicas[c.opcionesDe ?? ""] ?? [];
          celdas[c.nombre] = lista.find((o) => o.valor === v)?.etiqueta ?? String(v);
          break;
        }
        default:
          celdas[c.nombre] = String(v);
      }
    }
    return {
      id: String(r.id),
      activo: r.activo !== false,
      valores: valoresDesdeRegistro(def.campos, r),
      celdas,
    };
  });
}

/** Crea o actualiza un registro (dentro de accion(): `tx` es auditado). */
export async function guardarEnCatalogo(
  tx: Tx,
  clave: string,
  id: string | null,
  valores: unknown,
): Promise<string> {
  const cat = obtenerCatalogo(clave);
  if (!cat) throw new ErrorNegocio("Catálogo desconocido.");
  const datos = esquemaDesdeCampos(cat.def.campos).parse(valores) as Record<string, unknown>;
  await cat.srv.validar?.(datos, tx, id);
  const d = delegado(tx, cat.srv.modelo);

  if (id) {
    const existe = await d.findFirst({ where: { id, deletedAt: null } });
    if (!existe) throw new ErrorNegocio("El registro no existe o fue eliminado.");
    const r = await d.update({ where: { id }, data: datos });
    return String(r.id);
  }
  const r = await d.create({ data: datos });
  return String(r.id);
}

/** Borrado lógico, solo si no tiene registros relacionados. */
export async function eliminarDeCatalogo(tx: Tx, clave: string, id: string): Promise<void> {
  const cat = obtenerCatalogo(clave);
  if (!cat) throw new ErrorNegocio("Catálogo desconocido.");
  const d = delegado(tx, cat.srv.modelo);
  const registro = await d.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: { select: Object.fromEntries(cat.srv.bloqueantes.map((b) => [b, true])) },
    },
  });
  if (!registro) throw new ErrorNegocio("El registro no existe o ya fue eliminado.");
  const conteo = registro._count as Record<string, number>;
  const total = Object.values(conteo).reduce((a, b) => a + b, 0);
  if (total > 0) {
    throw new ErrorNegocio(
      `No se puede eliminar: tiene ${total} registro(s) relacionado(s). Puedes desactivarlo para que no aparezca en las listas.`,
    );
  }
  const data: Record<string, unknown> = { deletedAt: new Date(), activo: false };
  if (cat.srv.nombreUnico) data.nombre = `${String(registro.nombre)} · eliminado ${id.slice(-6)}`;
  await d.update({ where: { id }, data });
}

export async function cambiarActivoCatalogo(tx: Tx, clave: string, id: string, activo: boolean) {
  const cat = obtenerCatalogo(clave);
  if (!cat) throw new ErrorNegocio("Catálogo desconocido.");
  const d = delegado(tx, cat.srv.modelo);
  const existe = await d.findFirst({ where: { id, deletedAt: null } });
  if (!existe) throw new ErrorNegocio("El registro no existe o fue eliminado.");
  await d.update({ where: { id }, data: { activo } });
}
