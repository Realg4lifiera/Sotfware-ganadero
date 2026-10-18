import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_UNIDAD } from "@/lib/etiquetas";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoCOP, formatoNumero } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { costoUnitario } from "@/lib/servicios/alimentacion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { eliminarSuministro } from "./acciones";

export const metadata: Metadata = { title: "Alimentación" };

export default async function PaginaAlimentacion({
  searchParams,
}: PageProps<"/produccion/alimentacion">) {
  const usuario = await requierePermiso("produccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const suministros = await prismaBase.suministroAlimento.findMany({
    where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: {
      lote: { select: { nombre: true } },
      insumo: { select: { nombre: true, unidad: true, presentacion: true } },
      gasto: { select: { valorTotal: true, cantidad: true } },
    },
  });
  const filas = suministros.map((s) => {
    const cu = costoUnitario(s.gasto);
    return { ...s, costo: cu == null ? null : Math.round(cu * Number(s.cantidad)) };
  });
  // Totales por lote (cantidad por insumo y costo estimado).
  const porLote = new Map<string, { insumos: Map<string, number>; costo: number }>();
  for (const f of filas) {
    const l = porLote.get(f.lote.nombre) ?? { insumos: new Map(), costo: 0 };
    const unidad = f.insumo.presentacion ?? ETIQUETA_UNIDAD[f.insumo.unidad];
    const k = `${f.insumo.nombre} (${unidad})`;
    l.insumos.set(k, (l.insumos.get(k) ?? 0) + Number(f.cantidad));
    l.costo += f.costo ?? 0;
    porLote.set(f.lote.nombre, l);
  }
  const registra = puede(usuario.rol, "produccion:registrar");
  const costoTotal = filas.reduce((s, f) => s + (f.costo ?? 0), 0);
  return (
    <>
      <EncabezadoPagina
        titulo="Alimentación"
        descripcion={`Suministro de alimento por lote · ${nombreMes(mes)}`}
        volver={{ href: "/produccion", texto: "Producción" }}
        acciones={
          registra && (
            <Button asChild>
              <Link href="/produccion/alimentacion/nuevo">
                <Plus /> Registrar suministro
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/produccion/alimentacion" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Suministros" valor={formatoNumero(filas.length)} />
        <TarjetaResumen
          titulo="Costo estimado"
          valor={formatoCOP(costoTotal)}
          detalle="De los suministros enlazados a su compra"
        />
      </div>
      {filas.length === 0 ? (
        <EstadoVacio titulo="No hay suministros en este mes." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr] [&>*]:min-w-0">
          <div className="flex flex-col gap-4">
            {[...porLote.entries()].map(([lote, t]) => (
              <Card key={lote}>
                <CardHeader>
                  <CardTitle>{lote}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-1 text-sm">
                    {[...t.insumos.entries()].map(([insumo, cantidad]) => (
                      <li key={insumo} className="flex justify-between gap-3">
                        <span>{insumo}</span>
                        <span className="tabular-nums">{formatoNumero(cantidad)}</span>
                      </li>
                    ))}
                  </ul>
                  {t.costo > 0 && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Costo estimado {formatoCOP(t.costo)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <ul className="bg-card divide-y self-start overflow-hidden rounded-xl border">
            {filas.map((f) => (
              <li key={f.id} className="flex items-center gap-2 px-4 py-3">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{f.insumo.nombre}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {[formatoFecha(f.fecha), f.lote.nombre, f.nota].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="text-right text-sm tabular-nums">
                  {formatoNumero(f.cantidad)}
                  {f.costo != null && (
                    <span className="text-muted-foreground block text-xs">
                      {formatoCOP(f.costo)}
                    </span>
                  )}
                </span>
                {registra && (
                  <BotonEliminar
                    accion={eliminarSuministro.bind(null, f.id)}
                    titulo="¿Eliminar este suministro?"
                    descripcion={`${f.insumo.nombre} · ${f.lote.nombre} · ${formatoFecha(f.fecha)}`}
                    destino="/produccion/alimentacion"
                    compacto
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-muted-foreground mt-3 text-xs">
        El costo del alimento cuenta en Costos cuando se registra la compra; aquí solo se reparte
        por lote como referencia.
      </p>
    </>
  );
}
