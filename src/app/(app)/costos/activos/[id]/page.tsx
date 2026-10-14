import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismaBase } from "@/lib/db";
import { estadoActivo } from "@/lib/dominio/depreciacion";
import { formatoFecha, mesActualISO } from "@/lib/fechas";
import { formatoCOP } from "@/lib/formato";
import { valoresDesdeRegistro } from "@/lib/formularios/campos";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { CAMPOS_ACTIVO } from "@/lib/validaciones/activos";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { FormularioActivo } from "../formulario-activo";
import { eliminarActivo } from "../acciones";

export const metadata: Metadata = { title: "Activo" };

export default async function PaginaActivo({ params }: PageProps<"/costos/activos/[id]">) {
  const usuario = await requierePermiso("costos:leer");
  const { id } = await params;
  const a = await prismaBase.activo.findFirst({
    where: { id, deletedAt: null },
    include: { centroCosto: true },
  });
  if (!a) notFound();
  const editable = puede(usuario.rol, "costos:gestionar");
  const e = estadoActivo(
    {
      valorCompra: Number(a.valorCompra),
      valorResidual: Number(a.valorResidual),
      fechaCompra: a.fechaCompra,
      vidaUtilMeses: a.vidaUtilMeses,
      activo: a.activo,
    },
    mesActualISO(),
  );
  const centros = editable
    ? await prismaBase.centroCosto.findMany({
        where: { deletedAt: null },
        orderBy: { nombre: "asc" },
      })
    : [];
  return (
    <>
      <EncabezadoPagina
        titulo={a.nombre}
        descripcion={`Comprado el ${formatoFecha(a.fechaCompra)} · ${a.centroCosto?.nombre ?? "Sin centro"}${a.activo ? "" : " · fuera de uso"}`}
        volver={{ href: "/costos/activos", texto: "Activos" }}
        acciones={
          editable && (
            <BotonEliminar
              accion={eliminarActivo.bind(null, a.id)}
              titulo="¿Eliminar este activo?"
              descripcion="Su depreciación deja de contar en los costos. Si se vendió, mejor márcalo como fuera de uso."
              destino="/costos/activos"
            />
          )
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Valor de compra" valor={formatoCOP(a.valorCompra)} />
        <TarjetaResumen titulo="Depreciación mensual" valor={formatoCOP(e.cuotaMensual)} />
        <TarjetaResumen titulo="Depreciación acumulada" valor={formatoCOP(e.acumulada)} />
        <TarjetaResumen
          titulo="Valor en libros"
          valor={formatoCOP(e.valorEnLibros)}
          detalle={`${e.mesesRestantes} meses restantes`}
        />
      </div>
      {editable && (
        <FormularioActivo
          id={a.id}
          valores={valoresDesdeRegistro(CAMPOS_ACTIVO, a)}
          opcionesDinamicas={{ centros: centros.map((c) => ({ valor: c.id, etiqueta: c.nombre })) }}
        />
      )}
    </>
  );
}
