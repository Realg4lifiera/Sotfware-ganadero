import type { Metadata } from "next";
import { Download } from "lucide-react";
import { composicionHato } from "@/lib/dominio/categoria";
import { ETIQUETA_GRUPO_COSTO } from "@/lib/etiquetas";
import { mesDesdeParametro, nombreMes } from "@/lib/fechas";
import { formatoCOP, formatoLitros, formatoPorcentaje } from "@/lib/formato";
import { requierePermiso } from "@/lib/sesion";
import { informeDelMes } from "@/lib/servicios/costos";
import { animalesConCategoria, obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import type { GrupoCosto } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SelectorMes } from "@/components/selector-mes";
import { TablaComposicion } from "@/components/tabla-composicion";
import { TarjetaResumen } from "@/components/tarjeta-resumen";

export const metadata: Metadata = { title: "Informe del productor" };

const pesos = (n: number | null) => (n === null ? "—" : formatoCOP(Math.round(n)));

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="font-semibold tabular-nums">{valor}</span>
    </div>
  );
}

export default async function InformeProductor({
  searchParams,
}: PageProps<"/reportes/informe-productor">) {
  await requierePermiso("reportes:costos");
  const mes = mesDesdeParametro((await searchParams).mes);
  const [inf, animales, config] = await Promise.all([
    informeDelMes(mes),
    animalesConCategoria(),
    obtenerConfiguracionFinca(),
  ]);
  const { hato, totalHato } = composicionHato(
    animales.map((a) => a.categoria),
    config.hato,
  );
  return (
    <>
      <EncabezadoPagina
        titulo="Informe del productor"
        descripcion={`Costos de producción de leche · ${nombreMes(mes)}`}
        volver={{ href: "/reportes", texto: "Reportes" }}
        acciones={
          <Button variant="outline" asChild>
            <a href={`/api/exportar/informe-productor?mes=${mes}`}>
              <Download /> Excel
            </a>
          </Button>
        }
      />
      <SelectorMes mes={mes} ruta="/reportes/informe-productor" />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Costo / litro producido"
          valor={pesos(inf.costoPorLitroProducido)}
          detalle={`Lechería: ${pesos(inf.costoLecheriaPorLitroProducido)}`}
        />
        <TarjetaResumen
          titulo="Costo / litro vendido"
          valor={pesos(inf.costoPorLitroVendido)}
          detalle={`Lechería: ${pesos(inf.costoLecheriaPorLitroVendido)}`}
        />
        <TarjetaResumen
          titulo="Utilidad"
          valor={pesos(inf.utilidad)}
          detalle={inf.utilidad < 0 ? "Pérdida del mes" : undefined}
        />
        <TarjetaResumen
          titulo="Rentabilidad"
          valor={inf.rentabilidad === null ? "—" : formatoPorcentaje(inf.rentabilidad)}
          detalle="Utilidad / ingresos"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Costos por rubro</CardTitle>
            <CardDescription>
              $/L sobre litros producidos · % de participación en el costo total.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-5">
            <Table className="text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Rubro</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">$/L</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              {inf.grupos.map((g) => (
                <TableBody key={g.grupo}>
                  <TableRow className="bg-muted/60 font-semibold">
                    <TableCell>{ETIQUETA_GRUPO_COSTO[g.grupo as GrupoCosto]}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {pesos(g.total)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {pesos(g.porLitro)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatoPorcentaje(g.participacion)}
                    </TableCell>
                  </TableRow>
                  {g.rubros.map((r) => (
                    <TableRow key={r.rubroId}>
                      <TableCell className="pl-4 whitespace-normal sm:pl-6">{r.nombre}</TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {pesos(r.total)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {pesos(r.porLitro)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {formatoPorcentaje(r.participacion)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              ))}
              <TableFooter>
                <TableRow>
                  <TableCell>Total costos</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {pesos(inf.costoTotal)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {pesos(inf.costoPorLitroProducido)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {inf.costoTotal > 0 ? "100 %" : "—"}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Resultado del mes</CardTitle>
            </CardHeader>
            <CardContent>
              <Dato etiqueta="Litros producidos" valor={formatoLitros(inf.litros.producidos)} />
              <Dato etiqueta="Litros vendidos" valor={formatoLitros(inf.litros.vendidos)} />
              <Dato etiqueta="Consumo interno" valor={formatoLitros(inf.litros.consumo)} />
              <Dato etiqueta="Precio de venta por litro" valor={pesos(inf.precioVenta)} />
              <Dato etiqueta="Ingresos por leche" valor={pesos(inf.ingresos.leche)} />
              <Dato etiqueta="Otros ingresos" valor={pesos(inf.ingresos.otros)} />
              <Dato etiqueta="Total ingresos" valor={pesos(inf.ingresos.total)} />
              <Dato etiqueta="Total gastos" valor={pesos(inf.costoTotal)} />
              <Dato etiqueta="Utilidad" valor={pesos(inf.utilidad)} />
              <Dato
                etiqueta="Rentabilidad"
                valor={inf.rentabilidad === null ? "—" : formatoPorcentaje(inf.rentabilidad)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Solo lechería</CardTitle>
              <CardDescription>Costos asignados al centro de costo Lechería.</CardDescription>
            </CardHeader>
            <CardContent>
              <Dato etiqueta="Costo lechería" valor={pesos(inf.costoLecheria)} />
              <Dato
                etiqueta="Costo / litro producido"
                valor={pesos(inf.costoLecheriaPorLitroProducido)}
              />
              <Dato
                etiqueta="Costo / litro vendido"
                valor={pesos(inf.costoLecheriaPorLitroVendido)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Composición del hato</CardTitle>
              <CardDescription>Inventario actual frente al ideal.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-5">
              <TablaComposicion
                titulo="Inventario bovino"
                filas={hato}
                total={totalHato}
                conIdeal
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
