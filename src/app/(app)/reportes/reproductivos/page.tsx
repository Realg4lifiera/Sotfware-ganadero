import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { formatoFecha, mesDesdeParametro } from "@/lib/fechas";
import { formatoNumero, formatoPorcentaje } from "@/lib/formato";
import { requierePermiso } from "@/lib/sesion";
import { reporteReproductivo } from "@/lib/servicios/reporte-reproductivo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BotonPDF } from "@/components/boton-pdf";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";

export const metadata: Metadata = { title: "Reportes reproductivos" };

const num = (n: number | null, sufijo = "") => (n == null ? "—" : `${formatoNumero(n)}${sufijo}`);

export default async function ReporteReproductivo({
  searchParams,
}: PageProps<"/reportes/reproductivos">) {
  await requierePermiso("reportes:reproductivos");
  const mes = mesDesdeParametro((await searchParams).mes);
  const r = await reporteReproductivo(mes);
  const i = r.indicadores;
  return (
    <>
      <EncabezadoPagina
        titulo="Reportes reproductivos"
        descripcion={`Últimos 12 meses: ${formatoFecha(r.desde)} a ${formatoFecha(new Date(r.hasta.getTime() - 86_400_000))}`}
        volver={{ href: "/reportes", texto: "Reportes" }}
        acciones={
          <>
            <BotonPDF />
            <Button variant="outline" asChild>
              <a href={`/api/exportar/reproductivo?mes=${mes}`}>
                <Download /> Excel
              </a>
            </Button>
          </>
        }
      />
      <SelectorMes mes={mes} ruta="/reportes/reproductivos" />
      <div className="mb-2 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Intervalo entre partos"
          valor={num(i.iepPromedio, " días")}
          detalle={`${i.n.iep} intervalos`}
        />
        <TarjetaResumen
          titulo="Días abiertos"
          valor={num(i.diasAbiertosPromedio)}
          detalle={`${i.n.diasAbiertos} preñeces tras parto`}
        />
        <TarjetaResumen
          titulo="Servicios por concepción"
          valor={num(i.serviciosPorConcepcion)}
          detalle={`${i.n.servicios} servicios · ${i.n.concepciones} preñeces`}
        />
        <TarjetaResumen
          titulo="Tasa de preñez"
          valor={i.tasaPrenez == null ? "—" : formatoPorcentaje(i.tasaPrenez, 0)}
          detalle={`${i.n.expuestas} hembras servidas`}
        />
        <TarjetaResumen
          titulo="Edad al primer parto"
          valor={num(i.edadPrimerPartoMeses, " meses")}
          detalle={`${i.n.primerParto} novillas paridas`}
        />
      </div>
      <p className="text-muted-foreground mb-4 text-xs">
        Fórmulas validadas con el veterinario. Cada indicador cuenta los eventos ocurridos en el
        período. «Abiertos hoy»: días desde el último parto de las vacas que aún no quedan preñadas.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Por vaca</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hembra</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
                <TableHead className="text-right">Partos</TableHead>
                <TableHead className="text-right">IEP</TableHead>
                <TableHead className="hidden text-right md:table-cell">Días abiertos</TableHead>
                <TableHead className="text-right">Abiertos hoy</TableHead>
                <TableHead className="hidden text-right md:table-cell">Servicios</TableHead>
                <TableHead className="hidden text-right md:table-cell">Preñeces</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.filas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link
                      href={`/animales/${f.id}?pestana=reproduccion`}
                      className="hover:text-primary font-medium hover:underline"
                    >
                      {f.hembra}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{f.estado}</TableCell>
                  <TableCell className="text-right tabular-nums">{f.partos}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(f.iepPromedio)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {num(f.ultimosDiasAbiertos)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {num(f.diasAbiertosHoy)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {f.servicios}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {f.concepciones}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
