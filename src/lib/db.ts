import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente base de Prisma (sin auditoría). Úsalo solo para lecturas y para tareas del
 * sistema. Las escrituras de negocio van por `db` de `lib/auditoria.ts`.
 */
function crearCliente() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalParaPrisma = globalThis as unknown as { prismaBase?: ReturnType<typeof crearCliente> };

export const prismaBase = globalParaPrisma.prismaBase ?? crearCliente();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prismaBase = prismaBase;
