import "server-only";
import { prismaBase } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const vivo = { deletedAt: null } as const;
const resumen = {
  select: {
    id: true,
    numero: true,
    nombre: true,
    sexo: true,
    fotoClave: true,
    razaId: true,
    raza: { select: { nombre: true } },
  },
} as const;

const incluirHojaVida = {
  raza: true,
  lote: true,
  potrero: true,
  toro: { select: { id: true, nombre: true, codigo: true } },
  parto: { select: { id: true, fecha: true, tipo: true } },
  madre: {
    include: {
      raza: true,
      madre: resumen,
      padre: { select: { id: true, nombre: true, codigo: true, animalId: true } },
    },
  },
  padre: {
    include: {
      raza: true,
      animal: {
        include: {
          madre: resumen,
          padre: { select: { id: true, nombre: true, codigo: true, animalId: true } },
        },
      },
    },
  },
  crias: { where: vivo, orderBy: { fechaNacimiento: "desc" }, ...resumen },
  movimientos: {
    where: vivo,
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: {
      loteOrigen: { select: { nombre: true } },
      loteDestino: { select: { nombre: true } },
      potreroOrigen: { select: { nombre: true } },
      potreroDestino: { select: { nombre: true } },
      comprador: { select: { nombre: true } },
      proveedor: { select: { nombre: true } },
    },
  },
  celos: { where: vivo, orderBy: { fechaHora: "desc" } },
  servicios: {
    where: vivo,
    orderBy: { fecha: "desc" },
    include: {
      toro: { select: { nombre: true } },
      pajilla: { select: { codigo: true, toro: { select: { nombre: true } } } },
    },
  },
  diagnosticos: { where: vivo, orderBy: { fecha: "desc" } },
  partos: {
    where: vivo,
    orderBy: { fecha: "desc" },
    include: {
      toro: { select: { nombre: true } },
      crias: { where: vivo, select: { id: true, numero: true, nombre: true, sexo: true } },
    },
  },
  abortos: { where: vivo, orderBy: { fecha: "desc" } },
  secados: { where: vivo, orderBy: { fecha: "desc" } },
  descartesReproductivos: { where: vivo, orderBy: { fecha: "desc" } },
  lactancias: { where: vivo, orderBy: { fechaInicio: "desc" } },
  pesajes: { where: vivo, orderBy: { fecha: "desc" } },
  eventosSanitarios: { where: vivo, orderBy: { fecha: "desc" } },
  gastos: {
    where: vivo,
    orderBy: { fecha: "desc" },
    include: { categoria: { select: { nombre: true, rubro: { select: { nombre: true } } } } },
  },
  ingresos: { where: vivo, orderBy: { fecha: "desc" } },
} satisfies Prisma.AnimalInclude;

export type HojaVida = Prisma.AnimalGetPayload<{ include: typeof incluirHojaVida }>;

export async function obtenerHojaVida(id: string) {
  const animal = await prismaBase.animal.findFirst({
    where: { id, deletedAt: null },
    include: incluirHojaVida,
  });
  if (!animal) return null;
  // Descendencia como reproductor (si el animal está registrado como toro).
  const hijosComoToro = animal.toro
    ? await prismaBase.animal.findMany({
        where: { padreId: animal.toro.id, deletedAt: null },
        orderBy: { fechaNacimiento: "desc" },
        ...resumen,
      })
    : [];
  return { animal, hijosComoToro };
}
