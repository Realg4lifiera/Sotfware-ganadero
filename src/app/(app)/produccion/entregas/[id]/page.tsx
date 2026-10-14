import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismaBase } from "@/lib/db";
import { formatoFecha } from "@/lib/fechas";
import { formatoCOP, formatoLitros } from "@/lib/formato";
import { valoresDesdeRegistro } from "@/lib/formularios/campos";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesCompradores } from "@/lib/servicios/leche";
import { CAMPOS_ENTREGA } from "@/lib/validaciones/leche";
import { Card, CardContent } from "@/components/ui/card";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioEntrega } from "../formulario-entrega";
import { eliminarEntrega } from "../acciones";

export const metadata: Metadata = { title: "Entrega de leche" };

export default async function PaginaEntrega({ params }: PageProps<"/produccion/entregas/[id]">) {
  const usuario = await requierePermiso("produccion:leer");
  const { id } = await params;
  const e = await prismaBase.entregaLeche.findFirst({
    where: { id, deletedAt: null },
    include: { comprador: true },
  });
  if (!e) notFound();
  const editable = puede(usuario.rol, "leche:registrar");
  return (
    <>
      <EncabezadoPagina
        titulo={`Entrega de ${formatoLitros(e.litros)}`}
        descripcion={`${formatoFecha(e.fecha)} · ${e.comprador.nombre}`}
        volver={{ href: "/produccion/entregas", texto: "Entregas de leche" }}
        acciones={
          editable && (
            <BotonEliminar
              accion={eliminarEntrega.bind(null, e.id)}
              titulo="¿Eliminar esta entrega?"
              descripcion="Deja de contar en los litros vendidos. Queda en la auditoría."
              destino="/produccion/entregas"
            />
          )
        }
      />
      {editable ? (
        <FormularioEntrega
          id={e.id}
          valores={valoresDesdeRegistro(CAMPOS_ENTREGA, e)}
          opcionesDinamicas={await opcionesCompradores()}
        />
      ) : (
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <p>Litros: {formatoLitros(e.litros)}</p>
            <p>Precio/L: {e.precioLitro ? formatoCOP(e.precioLitro) : "—"}</p>
            <p>Comprador: {e.comprador.nombre}</p>
            <p>Nota: {e.nota ?? "—"}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
