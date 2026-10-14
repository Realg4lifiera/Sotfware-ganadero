import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { depreciacionEnMes, estadoActivo } from "@/lib/dominio/depreciacion";
import { formatoFecha, mesDesdeParametro, nombreMes } from "@/lib/fechas";
import { formatoCOP } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { VistaActivos, type FilaActivo } from "./vista-activos";

export const metadata: Metadata = { title: "Activos y depreciación" };

export default async function PaginaActivos({ searchParams }: PageProps<"/costos/activos">) {
  const usuario = await requierePermiso("costos:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const activos = await prismaBase.activo.findMany({
    where: { deletedAt: null },
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    include: { centroCosto: { select: { nombre: true } } },
  });
  const filas: FilaActivo[] = activos.map((a) => {
    const datos = {
      valorCompra: Number(a.valorCompra),
      valorResidual: Number(a.valorResidual),
      fechaCompra: a.fechaCompra,
      vidaUtilMeses: a.vidaUtilMeses,
      activo: a.activo,
    };
    const e = estadoActivo(datos, mes);
    return {
      id: a.id,
      nombre: a.nombre,
      centro: a.centroCosto?.nombre ?? "—",
      fechaCompra: formatoFecha(a.fechaCompra),
      valorCompra: datos.valorCompra,
      vidaUtil: `${a.vidaUtilMeses} meses`,
      cuotaMes: depreciacionEnMes(datos, mes),
      acumulada: e.acumulada,
      valorEnLibros: e.valorEnLibros,
      enUso: a.activo,
    };
  });
  const totalMes = filas.reduce((s, f) => s + f.cuotaMes, 0);
  const libros = filas.filter((f) => f.enUso).reduce((s, f) => s + f.valorEnLibros, 0);
  return (
    <>
      <EncabezadoPagina
        titulo="Activos y depreciación"
        descripcion={`Maquinaria y equipos · depreciación de ${nombreMes(mes)}`}
        volver={{ href: "/costos", texto: "Costos" }}
        acciones={
          puede(usuario.rol, "costos:gestionar") && (
            <Button asChild>
              <Link href="/costos/activos/nuevo">
                <Plus /> Nuevo activo
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/costos/activos" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Depreciación del mes"
          valor={formatoCOP(totalMes)}
          detalle="Va al rubro Depreciaciones"
        />
        <TarjetaResumen
          titulo="Valor en libros"
          valor={formatoCOP(libros)}
          detalle={`${filas.filter((f) => f.enUso).length} activos en uso`}
        />
      </div>
      <VistaActivos filas={filas} />
    </>
  );
}
