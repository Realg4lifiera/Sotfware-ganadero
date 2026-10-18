import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_JORNADA } from "@/lib/etiquetas";
import { fechaAISO, formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoLitros, formatoNumero } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { resumenOrdenosMes } from "@/lib/servicios/ordenos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { eliminarOrdenoLote } from "./acciones";

export const metadata: Metadata = { title: "Ordeños" };

export default async function PaginaOrdenos({ searchParams }: PageProps<"/produccion/ordenos">) {
  const usuario = await requierePermiso("produccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const [dias, totalesLote] = await Promise.all([
    resumenOrdenosMes(mes),
    prismaBase.registroOrdeno.findMany({
      where: { deletedAt: null, animalId: null, fecha: { gte: desde, lt: hasta } },
      orderBy: [{ fecha: "desc" }, { jornada: "asc" }],
      include: { lote: { select: { nombre: true } } },
    }),
  ]);
  const registra = puede(usuario.rol, "produccion:registrar");
  const controles = dias.filter((d) => d.vacas > 0);
  const litrosVaca = controles.length
    ? controles.reduce((s, d) => s + d.litrosVacas / d.vacas, 0) / controles.length
    : null;
  return (
    <>
      <EncabezadoPagina
        titulo="Ordeños"
        descripcion={`Control lechero y totales por lote · ${nombreMes(mes)}`}
        volver={{ href: "/produccion", texto: "Producción" }}
        acciones={
          registra && (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/produccion/ordenos/control">
                  <ClipboardList /> Control por vaca
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/produccion/ordenos/lote">
                  <Plus /> Total por lote
                </Link>
              </Button>
            </div>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/produccion/ordenos" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Días con control" valor={formatoNumero(controles.length)} />
        <TarjetaResumen
          titulo="Litros por vaca/día"
          valor={litrosVaca == null ? "—" : formatoLitros(Math.round(litrosVaca * 10) / 10)}
          detalle="Promedio de los días de control"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Conciliación diaria</CardTitle>
            <CardDescription>
              Ordeñado frente a entregado + consumo interno, en los días con ordeño registrado.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-5">
            {dias.length === 0 ? (
              <EstadoVacio titulo="No hay ordeños en este mes." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Ordeñado</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Salida</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dias.map((d) => (
                    <TableRow key={d.fecha.toISOString()}>
                      <TableCell>
                        {d.vacas > 0 && registra ? (
                          <Link
                            href={`/produccion/ordenos/control?fecha=${fechaAISO(d.fecha)}`}
                            className="hover:text-primary font-medium hover:underline"
                          >
                            {formatoFecha(d.fecha)}
                          </Link>
                        ) : (
                          formatoFecha(d.fecha)
                        )}
                        <span className="text-muted-foreground block text-xs">
                          {[d.vacas && `${d.vacas} vacas`, d.lotes && `${d.lotes} totales de lote`]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatoLitros(d.ordenado)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {d.salida ? formatoLitros(d.salida) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {d.salida
                          ? formatoLitros(Math.round((d.ordenado - d.salida) * 100) / 100)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Totales por lote</CardTitle>
          </CardHeader>
          <CardContent>
            {totalesLote.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin totales por lote este mes.</p>
            ) : (
              <ul className="divide-y text-sm">
                {totalesLote.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="block font-medium">{t.lote?.nombre}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatoFecha(t.fecha)} · {ETIQUETA_JORNADA[t.jornada]}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="tabular-nums">{formatoLitros(t.litros)}</span>
                      {registra && (
                        <BotonEliminar
                          accion={eliminarOrdenoLote.bind(null, t.id)}
                          titulo="¿Eliminar este total?"
                          descripcion={`${t.lote?.nombre} · ${formatoFecha(t.fecha)} · ${ETIQUETA_JORNADA[t.jornada]}`}
                          destino="/produccion/ordenos"
                        />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
