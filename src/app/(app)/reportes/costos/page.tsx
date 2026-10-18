import type { Metadata } from "next";
import { Download } from "lucide-react";
import { ETIQUETA_AGRUPACION } from "@/lib/dominio/reporte-costos";
import { nombreMes } from "@/lib/fechas";
import { formatoCOP, formatoPorcentaje } from "@/lib/formato";
import { requierePermiso } from "@/lib/sesion";
import { filtrosReporteCostos } from "@/lib/servicios/filtros-reporte";
import { reporteCostos } from "@/lib/servicios/reporte-costos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { FiltrosReporteCostos } from "./filtros";

export const metadata: Metadata = { title: "Reporte de costos" };

const mesCorto = (m: string) =>
  nombreMes(m)
    .replace(" de ", " ")
    .replace(/^(\w{3})\w*/, "$1");
const pesos = (n: number | undefined) => (n ? formatoCOP(Math.round(n)) : "—");

export default async function ReporteDeCostos({ searchParams }: PageProps<"/reportes/costos">) {
  await requierePermiso("reportes:costos");
  const f = filtrosReporteCostos(await searchParams);
  const r = await reporteCostos(f.desde, f.hasta, f.por);
  const porMesVisible = r.meses.length <= 12;
  return (
    <>
      <EncabezadoPagina
        titulo="Reporte de costos"
        descripcion={`${nombreMes(f.desde)} a ${nombreMes(f.hasta)} · por ${ETIQUETA_AGRUPACION[f.por].toLowerCase()}`}
        volver={{ href: "/reportes", texto: "Reportes" }}
        acciones={
          <Button variant="outline" asChild>
            <a href={`/api/exportar/reporte-costos?${new URLSearchParams(f)}`}>
              <Download /> Excel
            </a>
          </Button>
        }
      />
      <FiltrosReporteCostos {...f} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Costo total" valor={formatoCOP(Math.round(r.total))} />
        <TarjetaResumen
          titulo="Promedio mensual"
          valor={formatoCOP(Math.round(r.total / Math.max(r.meses.length, 1)))}
          detalle={`${r.meses.length} meses`}
        />
      </div>
      {r.filas.length === 0 ? (
        <EstadoVacio titulo="No hay costos en este período." />
      ) : (
        <Card>
          <CardContent className="px-0 sm:px-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ETIQUETA_AGRUPACION[f.por]}</TableHead>
                  {porMesVisible &&
                    r.meses.map((m) => (
                      <TableHead key={m} className="hidden text-right capitalize xl:table-cell">
                        {mesCorto(m)}
                      </TableHead>
                    ))}
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.filas.map((x) => (
                  <TableRow key={x.clave}>
                    <TableCell className="whitespace-normal">{x.nombre}</TableCell>
                    {porMesVisible &&
                      r.meses.map((m) => (
                        <TableCell key={m} className="hidden text-right tabular-nums xl:table-cell">
                          {pesos(x.porMes[m])}
                        </TableCell>
                      ))}
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {pesos(x.total)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatoPorcentaje(x.participacion)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  {porMesVisible &&
                    r.meses.map((m) => (
                      <TableCell key={m} className="hidden text-right tabular-nums xl:table-cell">
                        {pesos(r.totalPorMes[m])}
                      </TableCell>
                    ))}
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {pesos(r.total)}
                  </TableCell>
                  <TableCell className="text-right">100 %</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
      <p className="text-muted-foreground mt-3 text-xs">
        Sale del mismo motor de costos que el informe del productor: compras (IVA según la finca),
        cuotas de gastos administrativos, nómina y depreciación. Por lote y por animal solo se ven
        las compras y la nómina que se asignaron a un lote o animal; el detalle por mes aparece en
        pantallas anchas y en el Excel (máximo 24 meses).
      </p>
    </>
  );
}
