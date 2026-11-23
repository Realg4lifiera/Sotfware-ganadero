import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { configuracionPg } from "@/lib/conexion-bd";
import { extensionFinca, registrarResolvedorFinca } from "@/lib/finca";

/**
 * Cliente base de Prisma (sin auditoría), ya filtrado por la finca activa
 * (lib/finca.ts). Úsalo solo para lecturas y tareas del sistema. Las escrituras de
 * negocio van por `db` de `lib/auditoria.ts`.
 */
function crearCliente() {
  const adapter = new PrismaPg(configuracionPg());
  return new PrismaClient({ adapter }).$extends(extensionFinca);
}

const globalParaPrisma = globalThis as unknown as { prismaBase?: ReturnType<typeof crearCliente> };

export const prismaBase = globalParaPrisma.prismaBase ?? crearCliente();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prismaBase = prismaBase;

// La finca de la solicitud (cookie validada); import diferido para evitar ciclos.
registrarResolvedorFinca(async () => (await import("@/lib/finca-sesion")).idFincaActual());
