import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_TIPO_INGRESO } from "@/lib/etiquetas";
import { formatoFecha } from "@/lib/fechas";
import { formatoCOP, formatoNumero } from "@/lib/formato";
import { valoresDesdeRegistro } from "@/lib/formularios/campos";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesIngreso } from "@/lib/servicios/ingresos";
import { CAMPOS_INGRESO } from "@/lib/validaciones/ingresos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioIngreso } from "../formulario-ingreso";
import { eliminarIngreso } from "../acciones";

export const metadata: Metadata = { title: "Ingreso" };

export default async function PaginaIngreso({ params }: PageProps<"/costos/ingresos/[id]">) {
  const usuario = await requierePermiso("costos:leer");
  const { id } = await params;
  const i = await prismaBase.ingreso.findFirst({
    where: { id, deletedAt: null },
    include: {
      comprador: true,
      centroCosto: true,
      animal: { select: { id: true, numero: true, nombre: true } },
    },
  });
  if (!i) notFound();
  const automatico = !!i.movimientoAnimalId;
  const editable = puede(usuario.rol, "costos:gestionar") && !automatico;
  const filas: [string, React.ReactNode][] = [
    ["Tipo", ETIQUETA_TIPO_INGRESO[i.tipo]],
    ["Fecha", formatoFecha(i.fecha)],
    ["Comprador", i.comprador?.nombre],
    ["Cantidad", formatoNumero(i.cantidad, 3)],
    ["Valor unitario", formatoCOP(i.precioUnitario)],
    ["Total", formatoCOP(i.total)],
    ["Centro de costo", i.centroCosto?.nombre],
    [
      "Animal",
      i.animal && (
        <Link
          href={`/animales/${i.animal.id}`}
          className="text-primary font-semibold hover:underline"
        >
          {i.animal.numero}
          {i.animal.nombre ? ` · ${i.animal.nombre}` : ""}
        </Link>
      ),
    ],
    ["Nota", i.nota],
  ];
  return (
    <>
      <EncabezadoPagina
        titulo={i.concepto}
        descripcion={`${formatoCOP(i.total)} · ${formatoFecha(i.fecha)}`}
        volver={{ href: "/costos/ingresos", texto: "Ingresos" }}
        acciones={
          editable && (
            <BotonEliminar
              accion={eliminarIngreso.bind(null, i.id)}
              titulo="¿Eliminar este ingreso?"
              descripcion="Deja de contar en los ingresos del período. Queda en la auditoría."
              destino="/costos/ingresos"
            />
          )
        }
      />
      {automatico && (
        <Alert className="mb-4">
          <AlertDescription>
            Este ingreso se generó con la venta del animal. Para corregirlo, revisa su hoja de vida.
          </AlertDescription>
        </Alert>
      )}
      {editable ? (
        <FormularioIngreso
          id={i.id}
          valores={valoresDesdeRegistro(CAMPOS_INGRESO, i)}
          opcionesDinamicas={await opcionesIngreso()}
        />
      ) : (
        <Card>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {filas.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted-foreground text-xs font-medium">{k}</dt>
                  <dd className="text-sm">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </>
  );
}
