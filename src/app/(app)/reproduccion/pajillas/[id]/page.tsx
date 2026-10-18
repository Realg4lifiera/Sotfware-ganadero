import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_TIPO_MOVIMIENTO_PAJILLA } from "@/lib/etiquetas";
import { formatoFecha, hoyISO } from "@/lib/fechas";
import { formatoNumero } from "@/lib/formato";
import { valoresDesdeRegistro, valoresVacios } from "@/lib/formularios/campos";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesPajilla } from "@/lib/servicios/pajillas";
import { CAMPOS_MOVIMIENTO_PAJILLA, CAMPOS_PAJILLA } from "@/lib/validaciones/pajillas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { eliminarPajilla } from "../acciones";
import { FormularioMovimientoPajilla, FormularioPajilla } from "../formularios";

export const metadata: Metadata = { title: "Pajilla" };

export default async function PaginaPajilla({ params }: PageProps<"/reproduccion/pajillas/[id]">) {
  const usuario = await requierePermiso("reproduccion:leer");
  const { id } = await params;
  const p = await prismaBase.pajilla.findFirst({
    where: { id, deletedAt: null },
    include: {
      toro: true,
      raza: true,
      movimientos: {
        where: { deletedAt: null },
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
        include: { servicio: { select: { hembra: { select: { numero: true } } } } },
      },
    },
  });
  if (!p) notFound();
  const editable = puede(usuario.rol, "reproduccion:gestionar");
  const usos = p.movimientos.filter((m) => m.tipo === "USO").length;
  return (
    <>
      <EncabezadoPagina
        titulo={p.toro.codigo ? `${p.toro.nombre} (${p.toro.codigo})` : p.toro.nombre}
        descripcion={[p.raza?.nombre, p.codigo, p.ubicacionTermo].filter(Boolean).join(" · ")}
        volver={{ href: "/reproduccion/pajillas", texto: "Pajillas" }}
        acciones={
          editable && (
            <BotonEliminar
              accion={eliminarPajilla.bind(null, p.id)}
              titulo="¿Eliminar esta pajilla?"
              descripcion="Solo se puede si no tiene servicios. Si ya se usó, márcala como inactiva."
              destino="/reproduccion/pajillas"
            />
          )
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Existencias" valor={formatoNumero(p.existencias)} />
        <TarjetaResumen titulo="Inseminaciones" valor={formatoNumero(usos)} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {p.movimientos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin movimientos.</p>
            ) : (
              <ul className="divide-y text-sm">
                {p.movimientos.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {ETIQUETA_TIPO_MOVIMIENTO_PAJILLA[m.tipo]}
                        {m.servicio ? ` · vaca ${m.servicio.hembra.numero}` : ""}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {formatoFecha(m.fecha)}
                        {m.nota ? ` · ${m.nota}` : ""}
                      </span>
                    </span>
                    <span
                      className={`font-semibold tabular-nums ${m.cantidad < 0 ? "text-destructive" : "text-success"}`}
                    >
                      {m.cantidad > 0 ? "+" : ""}
                      {m.cantidad}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        {editable && (
          <FormularioMovimientoPajilla
            id={p.id}
            valores={{
              ...valoresVacios(CAMPOS_MOVIMIENTO_PAJILLA),
              tipo: "ENTRADA",
              fecha: hoyISO(),
            }}
          />
        )}
      </div>
      {editable && (
        <div className="mt-5">
          <FormularioPajilla
            id={p.id}
            valores={valoresDesdeRegistro(CAMPOS_PAJILLA, p)}
            opcionesDinamicas={await opcionesPajilla()}
          />
        </div>
      )}
    </>
  );
}
