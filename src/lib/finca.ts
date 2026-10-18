/**
 * Multifinca: aislamiento automático de los datos por finca.
 *
 * Cada modelo del negocio tiene `fincaId`. La extensión `extensionFinca` agrega la finca
 * activa a TODA consulta y escritura de esos modelos (where, data, create…), así ninguna
 * pantalla puede leer o escribir datos de otra finca aunque olvide filtrar.
 *
 * La finca activa sale de:
 * 1. `contextoFinca` (AsyncLocalStorage): lo fijan accion(), las rutas de exportación, el
 *    resumen de "Mis fincas" y los scripts (seed) con `conFinca()`.
 * 2. Si no hay contexto, el resolvedor de la solicitud (cookie validada contra el acceso del
 *    usuario, ver lib/finca-sesion.ts).
 * Sin finca, la consulta falla (ErrorSinFinca): nunca se consulta "sin filtro".
 *
 * Los catálogos genéricos (razas, rubros, categorías de gasto, insumos, proveedores), los
 * usuarios y las propias fincas son compartidos y no se filtran.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma } from "@/generated/prisma/client";

export const MODELOS_POR_FINCA = new Set<string>([
  "Potrero",
  "Lote",
  "Animal",
  "MovimientoAnimal",
  "Adjunto",
  "Auditoria",
  "CentroCosto",
  "Comprador",
  "Gasto",
  "Trabajador",
  "PagoNomina",
  "CostoIndirecto",
  "ReglaProrrateo",
  "ReglaProrrateoDetalle",
  "Activo",
  "Ingreso",
  "Presupuesto",
  "Toro",
  "Pajilla",
  "MovimientoPajilla",
  "Celo",
  "Servicio",
  "DiagnosticoPrenez",
  "Parto",
  "Aborto",
  "Secado",
  "DescarteReproductivo",
  "HistorialReproductivo",
  "Lactancia",
  "RegistroOrdeno",
  "EntregaLeche",
  "ConsumoInternoLeche",
  "Pesaje",
  "OcupacionPotrero",
  "SuministroAlimento",
  "EventoSanitario",
]);

export class ErrorSinFinca extends Error {
  constructor() {
    super("No hay una finca seleccionada.");
    this.name = "ErrorSinFinca";
  }
}

type Resolvedor = () => Promise<number | null>;

/**
 * Únicos por proceso (en globalThis): Next carga este módulo en varios paquetes del
 * servidor (páginas, rutas) y el cliente de Prisma se comparte entre ellos; con instancias
 * distintas, la extensión leería un contexto vacío.
 */
const global_ = globalThis as unknown as {
  contextoFinca?: AsyncLocalStorage<{ fincaId: number }>;
  resolvedorFinca?: Resolvedor;
};

export const contextoFinca = (global_.contextoFinca ??= new AsyncLocalStorage<{
  fincaId: number;
}>());

/** Lo registra lib/db.ts: obtiene la finca de la solicitud (cookie + acceso del usuario). */
export function registrarResolvedorFinca(r: Resolvedor) {
  global_.resolvedorFinca = r;
}

/** Ejecuta `fn` sobre una finca concreta (rutas, resumen de fincas, scripts, pruebas). */
export function conFinca<T>(fincaId: number, fn: () => PromiseLike<T> | T): Promise<T> {
  // Se espera DENTRO del contexto: las consultas de Prisma son perezosas y, devueltas sin
  // esperar, se ejecutarían fuera de él.
  return contextoFinca.run({ fincaId }, async () => await fn());
}

/** Finca activa, o null si no hay ninguna. */
export async function fincaDelContexto(): Promise<number | null> {
  const ctx = contextoFinca.getStore();
  if (ctx) return ctx.fincaId;
  try {
    return global_.resolvedorFinca ? await global_.resolvedorFinca() : null;
  } catch {
    // Fuera de una solicitud (p. ej. scripts) no hay cookies.
    return null;
  }
}

type Args = Record<string, unknown> & {
  where?: Record<string, unknown>;
  data?: unknown;
  create?: Record<string, unknown>;
};

const conFiltro = (where: Record<string, unknown> | undefined, fincaId: number) => ({
  ...(where ?? {}),
  fincaId,
});

export const extensionFinca = Prisma.defineExtension({
  name: "finca",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!MODELOS_POR_FINCA.has(model)) return query(args);
        const fincaId = await fincaDelContexto();
        if (fincaId == null) {
          // La auditoría de acciones globales (crear una finca, usuarios) no tiene finca.
          if (model === "Auditoria" && operation === "create") return query(args);
          throw new ErrorSinFinca();
        }
        const a = { ...(args as Args) };
        switch (operation) {
          case "create":
            a.data = { ...(a.data as object), fincaId };
            break;
          case "createMany":
          case "createManyAndReturn":
            a.data = (Array.isArray(a.data) ? a.data : [a.data]).map((d) => ({
              ...(d as object),
              fincaId,
            }));
            break;
          case "upsert":
            a.where = conFiltro(a.where, fincaId);
            a.create = { ...a.create, fincaId };
            break;
          default:
            // find*, count, aggregate, groupBy, update*, delete*: siempre dentro de la finca.
            a.where = conFiltro(a.where, fincaId);
        }
        return query(a as typeof args);
      },
    },
  },
});

/** Id de la finca activa; lanza ErrorSinFinca si no hay ninguna. */
export async function idFinca(): Promise<number> {
  const id = await fincaDelContexto();
  if (id == null) throw new ErrorSinFinca();
  return id;
}
