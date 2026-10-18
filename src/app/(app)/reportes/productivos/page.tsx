import type { Metadata } from "next";
import { Download } from "lucide-react";
import { mesDesdeParametro, nombreMes } from "@/lib/fechas";
import { formatoCOP, formatoKg, formatoLitros, formatoNumero } from "@/lib/formato";
import { requierePermiso } from "@/lib/sesion";
import { indicadoresProductivosMes } from "@/lib/servicios/indicadores-productivos";
import { estadoPotreros } from "@/lib/servicios/rotacion";
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
import { EstadoVacio } from "@/components/estado-vacio";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";

export const metadata: Metadata = { title: "Reportes productivos" };

const nulo = <T,>(v: T | null, f: (x: T) => string) => (v == null ? "—" : f(v));

export default async function ReporteProductivo({
  searchParams,
}: PageProps<"/reportes/productivos">) {
  await requierePermiso("reportes:productivos");
  const mes = mesDesdeParametro((await searchParams).mes);
  const [i, carga] = await Promise.all([indicadoresProductivosMes(mes), estadoPotreros()]);
  return (
    <>
      <EncabezadoPagina
        titulo="Reportes productivos"
        descripcion={`Leche, ganancia de peso y carga animal · ${nombreMes(mes)}`}
        volver={{ href: "/reportes", texto: "Reportes" }}
        acciones={
          <>
            <BotonPDF />
            <Button variant="outline" asChild>
              <a href={`/api/exportar/productivo?mes=${mes}`}>
                <Download /> Excel
              </a>
            </Button>
          </>
        }
      />
      <SelectorMes mes={mes} ruta="/reportes/productivos" />
      <h2 className="font-display mb-2 text-lg font-semibold">Leche</h2>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Litros producidos" valor={formatoLitros(i.litrosProducidos)} />
        <TarjetaResumen
          titulo="Litros por vaca/día"
          valor={nulo(i.litrosVacaDia, formatoLitros)}
          detalle={`${formatoNumero(i.vacaDias)} vacas-día en producción`}
        />
        <TarjetaResumen
          titulo="Litros por hectárea"
          valor={nulo(i.litrosHa, formatoLitros)}
          detalle={
            i.litrosHa == null ? "Configura el área útil en Finca" : "En el mes, sobre área útil"
          }
        />
        <TarjetaResumen
          titulo="Carga animal"
          valor={nulo(carga.cargaUaHa, (x) => `${formatoNumero(x)} UA/ha`)}
          detalle={`Hoy · ${formatoNumero(carga.totalUa, 1)} UA`}
        />
      </div>
      <h2 className="font-display mb-2 text-lg font-semibold">Carne y costos</h2>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Kilos ganados"
          valor={formatoKg(i.kilosGanados)}
          detalle="Lotes de cría, levante y ceba"
        />
        <TarjetaResumen
          titulo="Costo por kilo ganado"
          valor={nulo(i.costoKiloGanado, formatoCOP)}
          detalle={`Costos de cría, levante y ceba: ${formatoCOP(i.costoCarne)}`}
        />
        <TarjetaResumen
          titulo="Costo por animal/día"
          valor={nulo(i.costoAnimalDia, formatoCOP)}
          detalle={`${formatoNumero(i.animalDias)} animales-día`}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ganancia de peso por lote</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-5">
          {i.ganancia.length === 0 ? (
            <EstadoVacio titulo="Sin pesajes que cubran este mes." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-right">Animales</TableHead>
                  <TableHead className="text-right">Kilos</TableHead>
                  <TableHead className="text-right">GDP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {i.ganancia.map((l) => (
                  <TableRow key={l.nombre}>
                    <TableCell className="font-medium">{l.nombre}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.animales}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatoKg(l.kilos)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {nulo(l.gdp, (x) => `${formatoNumero(x)} g/día`)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-muted-foreground mt-3 text-xs">
        Fórmulas pendientes de validación con el veterinario. Los kilos ganados reparten por días la
        ganancia entre pesajes; los animales-día cuentan los días que cada animal estuvo en la finca
        en el mes.
      </p>
    </>
  );
}
