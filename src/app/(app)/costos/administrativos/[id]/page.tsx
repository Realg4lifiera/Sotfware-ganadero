import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismaBase } from "@/lib/db";
import { mesesCubiertos } from "@/lib/dominio/prorrateo";
import { ETIQUETA_PERIODICIDAD } from "@/lib/etiquetas";
import { formatoFecha, nombreMes } from "@/lib/fechas";
import { formatoCOP, formatoLitros } from "@/lib/formato";
import { valoresDesdeRegistro } from "@/lib/formularios/campos";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesCostoIndirecto } from "@/lib/servicios/costos-indirectos";
import { CAMPOS_COSTO_INDIRECTO_TODOS } from "@/lib/validaciones/costos-indirectos";
import { Card, CardContent } from "@/components/ui/card";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioCosto } from "../formulario-costo";
import { eliminarCosto } from "../acciones";

export const metadata: Metadata = { title: "Gasto administrativo" };

export default async function PaginaCosto({ params }: PageProps<"/costos/administrativos/[id]">) {
  const usuario = await requierePermiso("costos:leer");
  const { id } = await params;
  const c = await prismaBase.costoIndirecto.findFirst({
    where: { id, deletedAt: null },
    include: { categoria: true, centroCosto: true, reglaProrrateo: true, proveedor: true },
  });
  if (!c) notFound();
  const editable = puede(usuario.rol, "costos:gestionar");
  const meses = mesesCubiertos(c.fecha, c.periodicidad);

  let contenido: React.ReactNode;
  if (editable) {
    const opciones = await opcionesCostoIndirecto();
    if (!opciones.categorias.some((o) => o.valor === c.categoriaId))
      opciones.categorias.push({
        valor: c.categoriaId,
        etiqueta: `${c.categoria.nombre} (inactivo)`,
      });
    contenido = (
      <FormularioCosto
        id={c.id}
        valores={valoresDesdeRegistro(CAMPOS_COSTO_INDIRECTO_TODOS, c)}
        opcionesDinamicas={opciones}
      />
    );
  } else {
    const filas: [string, string][] = [
      ["Concepto", c.categoria.nombre],
      ["Valor total", formatoCOP(c.valorTotal)],
      ["Período", ETIQUETA_PERIODICIDAD[c.periodicidad]],
      ["Meses", meses.map(nombreMes).join(", ")],
      ["Asignación", c.centroCosto?.nombre ?? `Regla: ${c.reglaProrrateo?.nombre}`],
      ["Litros", c.litros ? formatoLitros(c.litros) : "—"],
      ["Proveedor", c.proveedor?.nombre ?? "—"],
      ["Nota", c.nota ?? "—"],
    ];
    contenido = (
      <Card>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {filas.map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground text-xs font-medium">{k}</dt>
                <dd className="text-sm">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      <EncabezadoPagina
        titulo={c.categoria.nombre}
        descripcion={`${formatoCOP(c.valorTotal)} · ${ETIQUETA_PERIODICIDAD[c.periodicidad].toLowerCase()} desde ${formatoFecha(c.fecha)}`}
        volver={{ href: "/costos/administrativos", texto: "Gastos administrativos" }}
        acciones={
          editable && (
            <BotonEliminar
              accion={eliminarCosto.bind(null, c.id)}
              titulo="¿Eliminar este gasto administrativo?"
              descripcion="Deja de contar en los costos de todos los meses que cubre. Queda en la auditoría."
              destino="/costos/administrativos"
            />
          )
        }
      />
      {contenido}
    </>
  );
}
