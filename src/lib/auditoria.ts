import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { ITXClientDenyList } from "@prisma/client/runtime/client";
import { Prisma } from "@/generated/prisma/client";
import { prismaBase } from "@/lib/db";
import { diferencias, serializar } from "@/lib/auditoria-diff";

/**
 * Auditoría centralizada.
 *
 * `db` es el cliente de Prisma con una extensión que intercepta toda escritura:
 * - llena createdById / updatedById con el usuario de la acción;
 * - lee el registro "antes", ejecuta la escritura y guarda en `Auditoria` qué cambió;
 * - un `update` que pone `deletedAt` se registra como ELIMINAR (borrado lógico);
 * - bloquea `delete`, `createMany`, `updateMany` y `deleteMany` (no serían auditables
 *   fila por fila).
 *
 * Toda escritura debe ocurrir dentro de `accion()` (lib/accion.ts), que abre una
 * transacción y fija el contexto. Así el cambio y su registro de auditoría se guardan
 * juntos o no se guarda ninguno.
 */
export interface ContextoAuditoria {
  usuarioId: string;
  usuarioNombre: string;
  tx?: Tx;
}

export const contextoAuditoria = new AsyncLocalStorage<ContextoAuditoria>();

/** Modelos que no se auditan (la propia bitácora). */
const SIN_AUDITORIA = new Set<string>(["Auditoria"]);

type Delegado = {
  findUnique(args: { where: unknown }): Promise<Record<string, unknown> | null>;
};

function delegado(tx: Tx, modelo: string): Delegado {
  const nombre = modelo.charAt(0).toLowerCase() + modelo.slice(1);
  return (tx as unknown as Record<string, Delegado>)[nombre];
}

function exigirContexto(modelo: string, operacion: string) {
  const ctx = contextoAuditoria.getStore();
  if (!ctx?.tx) {
    throw new Error(
      `Escritura ${modelo}.${operacion} fuera de accion(): toda escritura debe auditarse.`,
    );
  }
  return ctx as Required<ContextoAuditoria>;
}

async function registrar(
  ctx: Required<ContextoAuditoria>,
  entidad: string,
  entidadId: string,
  accion: "CREAR" | "EDITAR" | "ELIMINAR",
  antes: Record<string, unknown> | null,
  despues: Record<string, unknown> | null,
) {
  let a = antes ? serializar(antes) : null;
  let d = despues ? serializar(despues) : null;
  if (accion !== "CREAR" && a && d) {
    [a, d] = diferencias(a, d);
    if (accion === "EDITAR" && Object.keys(d).length === 0) return; // sin cambios reales
  }
  await ctx.tx.auditoria.create({
    data: {
      usuarioId: ctx.usuarioId,
      usuarioNombre: ctx.usuarioNombre,
      entidad,
      entidadId,
      accion,
      antes: a ?? Prisma.DbNull,
      despues: d ?? Prisma.DbNull,
    },
  });
}

/** Garantiza que un `select` explícito incluya el id (para poder auditar). */
function conId<T extends { select?: unknown }>(args: T): T {
  if (args.select && typeof args.select === "object") {
    return { ...args, select: { ...(args.select as object), id: true } };
  }
  return args;
}

function bloquear(modelo: string, operacion: string): never {
  throw new Error(
    `${modelo}.${operacion} no está permitido: no se puede auditar fila por fila. ` +
      `Usa operaciones individuales (y borrado lógico con deletedAt).`,
  );
}

export const extensionAuditoria = Prisma.defineExtension({
  name: "auditoria",
  query: {
    $allModels: {
      async create({ model, args, query }) {
        if (SIN_AUDITORIA.has(model)) return query(args);
        const ctx = exigirContexto(model, "create");
        const datos = args.data as Record<string, unknown>;
        args.data = {
          ...datos,
          createdById: ctx.usuarioId,
          updatedById: ctx.usuarioId,
        } as typeof args.data;
        const r = (await query(conId(args))) as Record<string, unknown>;
        await registrar(ctx, model, String(r.id), "CREAR", null, r);
        return r;
      },

      async createManyAndReturn({ model, args, query }) {
        if (SIN_AUDITORIA.has(model)) return query(args);
        const ctx = exigirContexto(model, "createManyAndReturn");
        const filas = (Array.isArray(args.data) ? args.data : [args.data]) as Record<
          string,
          unknown
        >[];
        args.data = filas.map((f) => ({
          ...f,
          createdById: ctx.usuarioId,
          updatedById: ctx.usuarioId,
        })) as typeof args.data;
        const r = (await query(conId(args))) as Record<string, unknown>[];
        for (const fila of r) await registrar(ctx, model, String(fila.id), "CREAR", null, fila);
        return r;
      },

      async update({ model, args, query }) {
        if (SIN_AUDITORIA.has(model)) bloquear(model, "update");
        const ctx = exigirContexto(model, "update");
        const antes = await delegado(ctx.tx, model).findUnique({ where: args.where });
        const datos = args.data as Record<string, unknown>;
        args.data = { ...datos, updatedById: ctx.usuarioId } as typeof args.data;
        const r = (await query(conId(args))) as Record<string, unknown>;
        const despues = await delegado(ctx.tx, model).findUnique({ where: { id: r.id } });
        const eliminado = antes && !antes.deletedAt && despues?.deletedAt;
        await registrar(
          ctx,
          model,
          String(r.id),
          eliminado ? "ELIMINAR" : "EDITAR",
          antes,
          despues,
        );
        return r;
      },

      async upsert({ model, args, query }) {
        if (SIN_AUDITORIA.has(model)) bloquear(model, "upsert");
        const ctx = exigirContexto(model, "upsert");
        const antes = await delegado(ctx.tx, model).findUnique({ where: args.where });
        args.create = {
          ...(args.create as Record<string, unknown>),
          createdById: ctx.usuarioId,
          updatedById: ctx.usuarioId,
        } as typeof args.create;
        args.update = {
          ...(args.update as Record<string, unknown>),
          updatedById: ctx.usuarioId,
        } as typeof args.update;
        const r = (await query(conId(args))) as Record<string, unknown>;
        const despues = await delegado(ctx.tx, model).findUnique({ where: { id: r.id } });
        await registrar(ctx, model, String(r.id), antes ? "EDITAR" : "CREAR", antes, despues);
        return r;
      },

      async delete({ model }) {
        bloquear(model, "delete");
      },
      async createMany({ model }) {
        bloquear(model, "createMany");
      },
      async updateMany({ model }) {
        bloquear(model, "updateMany");
      },
      async updateManyAndReturn({ model }) {
        bloquear(model, "updateManyAndReturn");
      },
      async deleteMany({ model }) {
        bloquear(model, "deleteMany");
      },
    },
  },
});

/** Cliente de Prisma auditado. Úsalo dentro de accion() (vía ctx.tx) para escribir. */
export const db = prismaBase.$extends(extensionAuditoria);

/** Cliente transaccional auditado (el `tx` de accion()). */
export type Tx = Omit<typeof db, ITXClientDenyList>;
