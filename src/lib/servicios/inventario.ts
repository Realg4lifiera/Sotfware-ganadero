import "server-only";
import { prismaBase } from "@/lib/db";
import {
  calcularCategoria,
  leerConfiguracion,
  type CategoriaAnimal,
  type ConfiguracionFinca,
} from "@/lib/dominio/categoria";
import { hoy } from "@/lib/fechas";
import type { Prisma } from "@/generated/prisma/client";

export async function obtenerConfiguracionFinca(): Promise<ConfiguracionFinca> {
  const finca = await prismaBase.finca.findUnique({
    where: { id: 1 },
    select: { configuracion: true },
  });
  return leerConfiguracion(finca?.configuracion);
}

const incluirInventario = {
  raza: { select: { id: true, nombre: true } },
  lote: { select: { id: true, nombre: true } },
  potrero: { select: { id: true, nombre: true } },
  toro: { select: { id: true } },
  lactancias: { where: { fechaFin: null, deletedAt: null }, select: { id: true } },
} satisfies Prisma.AnimalInclude;

export type AnimalInventario = Prisma.AnimalGetPayload<{ include: typeof incluirInventario }> & {
  categoria: CategoriaAnimal;
};

/** Animales (no eliminados) con su categoría calculada. Por defecto solo los activos. */
export async function animalesConCategoria(
  where: Prisma.AnimalWhereInput = { estado: "ACTIVO" },
): Promise<AnimalInventario[]> {
  const [config, animales] = await Promise.all([
    obtenerConfiguracionFinca(),
    prismaBase.animal.findMany({
      where: { deletedAt: null, ...where },
      include: incluirInventario,
      orderBy: { numero: "asc" },
    }),
  ]);
  const referencia = hoy();
  return animales.map((a) => ({
    ...a,
    categoria: calcularCategoria(
      {
        especie: a.especie,
        sexo: a.sexo,
        fechaNacimiento: a.fechaNacimiento,
        numeroPartos: a.numeroPartos,
        lactanciaAbierta: a.lactancias.length > 0,
        esToro: !!a.toro,
      },
      referencia,
      config.hato,
    ),
  }));
}
