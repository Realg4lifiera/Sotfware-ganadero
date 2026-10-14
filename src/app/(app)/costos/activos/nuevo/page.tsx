import type { Metadata } from "next";
import { prismaBase } from "@/lib/db";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { CAMPOS_ACTIVO } from "@/lib/validaciones/activos";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioActivo } from "../formulario-activo";

export const metadata: Metadata = { title: "Nuevo activo" };

export default async function NuevoActivo() {
  await requierePermiso("costos:gestionar");
  const centros = await prismaBase.centroCosto.findMany({
    where: { deletedAt: null, activo: true },
    orderBy: { nombre: "asc" },
  });
  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo activo"
        descripcion="Maquinaria o equipo. La depreciación mensual se carga sola a los costos."
        volver={{ href: "/costos/activos", texto: "Activos" }}
      />
      <FormularioActivo
        valores={{ ...valoresVacios(CAMPOS_ACTIVO), fechaCompra: hoyISO() }}
        opcionesDinamicas={{ centros: centros.map((c) => ({ valor: c.id, etiqueta: c.nombre })) }}
      />
    </>
  );
}
