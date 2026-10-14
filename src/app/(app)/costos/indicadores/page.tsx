import type { Metadata } from "next";
import Link from "next/link";
import { mesDesdeParametro, nombreMes } from "@/lib/fechas";
import { formatoCOP, formatoLitros, formatoPorcentaje } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { informeDelMes } from "@/lib/servicios/costos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";

export const metadata: Metadata = { title: "Indicadores de costo" };

const pesos = (n: number | null) => (n === null ? "—" : formatoCOP(Math.round(n)));

function mesesHasta(mes: string, cantidad: number): string[] {
  const [a, m] = mes.split("-").map(Number);
  return Array.from({ length: cantidad }, (_, i) =>
    new Date(Date.UTC(a, m - cantidad + i, 1)).toISOString().slice(0, 7),
  );
}

export default async function IndicadoresCosto({ searchParams }: PageProps<"/costos/indicadores">) {
  const usuario = await requierePermiso("costos:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const meses = mesesHasta(mes, 12);
  const informes = await Promise.all(meses.map((m) => informeDelMes(m)));
  const filas = meses.map((m, i) => ({ mes: m, inf: informes[i] })).reverse();
  return (
    <>
      <EncabezadoPagina
        titulo="Indicadores de costo"
        descripcion={`Últimos 12 meses hasta ${nombreMes(mes)}`}
        volver={{ href: "/costos", texto: "Costos" }}
      />
      <SelectorMes mes={mes} ruta="/costos/indicadores" />
      <Card>
        <CardHeader>
          <CardTitle>Costo por litro y rentabilidad</CardTitle>
          <CardDescription>
            Total finca y solo lechería. Litros producidos = vendidos + consumo interno.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">$/L producido</TableHead>
                <TableHead className="hidden text-right md:table-cell">$/L vendido</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Lechería $/L</TableHead>
                <TableHead className="hidden text-right md:table-cell">Litros producidos</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Costos</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Ingresos</TableHead>
                <TableHead className="text-right">Rentab.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map(({ mes: m, inf }) => (
                <TableRow key={m}>
                  <TableCell className="first-letter:uppercase">
                    {puede(usuario.rol, "reportes:costos") ? (
                      <Link
                        href={`/reportes/informe-productor?mes=${m}`}
                        className="hover:text-primary hover:underline"
                      >
                        {nombreMes(m)}
                      </Link>
                    ) : (
                      nombreMes(m)
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pesos(inf.costoPorLitroProducido)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {pesos(inf.costoPorLitroVendido)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {pesos(inf.costoLecheriaPorLitroProducido)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {formatoLitros(inf.litros.producidos)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {pesos(inf.costoTotal)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {pesos(inf.ingresos.total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {inf.rentabilidad === null ? "—" : formatoPorcentaje(inf.rentabilidad)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-muted-foreground mt-4 text-sm">
        El costo por kilo ganado y por animal/día se activan con los pesajes y el inventario
        histórico del módulo productivo.
      </p>
    </>
  );
}
