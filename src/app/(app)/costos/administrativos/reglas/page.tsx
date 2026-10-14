import type { Metadata } from "next";
import { prismaBase } from "@/lib/db";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { reglasVigentes } from "@/lib/servicios/costos-indirectos";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { VistaReglas } from "./vista-reglas";

export const metadata: Metadata = { title: "Reglas de prorrateo" };

export default async function PaginaReglas() {
  const usuario = await requierePermiso("costos:leer");
  const [reglas, centros] = await Promise.all([
    reglasVigentes(),
    prismaBase.centroCosto.findMany({
      where: { deletedAt: null, activo: true },
      orderBy: { nombre: "asc" },
    }),
  ]);
  return (
    <>
      <EncabezadoPagina
        titulo="Reglas de prorrateo"
        descripcion="Cómo se reparten los gastos administrativos entre los centros de costo (deben sumar 100 %)."
        volver={{ href: "/costos/administrativos", texto: "Gastos administrativos" }}
      />
      <VistaReglas
        editable={puede(usuario.rol, "costos:gestionar")}
        centros={centros.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
        reglas={reglas.map((r) => ({
          id: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion ?? "",
          detalles: r.detalles.map((d) => ({
            centroCostoId: d.centroCostoId,
            centro: d.centroCosto.nombre,
            porcentaje: Number(d.porcentaje),
          })),
        }))}
      />
    </>
  );
}
