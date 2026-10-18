import type { Metadata } from "next";
import { prismaBase } from "@/lib/db";
import { conFinca } from "@/lib/finca";
import { requierePermisoGlobal } from "@/lib/sesion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { VistaFincas, type FilaFinca } from "./vista-fincas";

export const metadata: Metadata = { title: "Gestionar fincas" };

export default async function GestionarFincas() {
  await requierePermisoGlobal("finca:gestionar");
  const fincas = await prismaBase.finca.findMany({
    where: { deletedAt: null },
    orderBy: [{ activa: "desc" }, { nombre: "asc" }],
    include: {
      usuarios: {
        where: { deletedAt: null, usuario: { activo: true, rol: { not: "ADMIN" } } },
        select: { id: true },
      },
    },
  });
  const filas: FilaFinca[] = await Promise.all(
    fincas.map(async (f) => ({
      id: f.id,
      nombre: f.nombre,
      departamento: f.departamento ?? "",
      municipio: f.municipio ?? "",
      vereda: f.vereda ?? "",
      ubicacion: [f.vereda, f.municipio, f.departamento].filter(Boolean).join(", "),
      activa: f.activa,
      usuarios: f.usuarios.length,
      animales: await conFinca(f.id, () =>
        prismaBase.animal.count({ where: { deletedAt: null, estado: "ACTIVO" } }),
      ),
    })),
  );
  return (
    <>
      <EncabezadoPagina
        titulo="Gestionar fincas"
        descripcion="Crea las fincas que manejas, cámbiales el nombre o desactívalas. Los datos de cada finca (animales, potreros, costos) se llevan al entrar a ella."
        volver={{ href: "/fincas", texto: "Mis fincas" }}
      />
      <VistaFincas filas={filas} />
    </>
  );
}
