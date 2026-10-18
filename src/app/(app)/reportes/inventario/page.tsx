import type { Metadata } from "next";
import { Download } from "lucide-react";
import { CATEGORIAS, ETIQUETA_CATEGORIA, type CategoriaAnimal } from "@/lib/dominio/categoria";
import { mesDesdeParametro, nombreMes } from "@/lib/fechas";
import { formatoNumero } from "@/lib/formato";
import { requierePermiso } from "@/lib/sesion";
import { reporteInventario } from "@/lib/servicios/reporte-inventario";
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
import { BotonPDF } from "@/components/boton-pdf";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TablaComposicion } from "@/components/tabla-composicion";

export const metadata: Metadata = { title: "Inventario" };

function Linea({ texto, valor, fuerte }: { texto: string; valor: number; fuerte?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-3 border-b py-2 text-sm last:border-0 ${fuerte ? "font-semibold" : ""}`}
    >
      <span>{texto}</span>
      <span className="tabular-nums">{formatoNumero(valor)}</span>
    </div>
  );
}

function TablaGrupo({
  titulo,
  filas,
}: {
  titulo: string;
  filas: ({ nombre: string; total: number } & Record<CategoriaAnimal, number>)[];
}) {
  // Solo las categorías que tienen animales.
  const columnas = CATEGORIAS.filter((c) => filas.some((f) => f[c] > 0));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{titulo}</TableHead>
          {columnas.map((c) => (
            <TableHead key={c} className="hidden text-right lg:table-cell">
              {ETIQUETA_CATEGORIA[c]}
            </TableHead>
          ))}
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((f) => (
          <TableRow key={f.nombre}>
            <TableCell className="font-medium whitespace-normal">
              {f.nombre}
              <span className="text-muted-foreground block text-xs font-normal lg:hidden">
                {columnas
                  .filter((c) => f[c] > 0)
                  .map((c) => `${f[c]} ${ETIQUETA_CATEGORIA[c].toLowerCase()}`)
                  .join(" · ")}
              </span>
            </TableCell>
            {columnas.map((c) => (
              <TableCell key={c} className="hidden text-right tabular-nums lg:table-cell">
                {f[c] || "—"}
              </TableCell>
            ))}
            <TableCell className="text-right font-semibold tabular-nums">{f.total}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function ReporteInventario({
  searchParams,
}: PageProps<"/reportes/inventario">) {
  await requierePermiso("reportes:inventario");
  const mes = mesDesdeParametro((await searchParams).mes);
  const r = await reporteInventario(mes);
  const x = r.rotacion;
  return (
    <>
      <EncabezadoPagina
        titulo="Inventario"
        descripcion="Composición actual del hato y rotación mensual."
        volver={{ href: "/reportes", texto: "Reportes" }}
        acciones={
          <>
            <BotonPDF />
            <Button variant="outline" asChild>
              <a href={`/api/exportar/inventario?mes=${mes}`}>
                <Download /> Excel
              </a>
            </Button>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr] [&>*]:min-w-0">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Rotación del mes</CardTitle>
            <CardDescription>{nombreMes(mes)}</CardDescription>
          </CardHeader>
          <CardContent>
            <SelectorMes mes={mes} ruta="/reportes/inventario" />
            <Linea texto="Inventario al inicio del mes" valor={x.inicial} fuerte />
            <Linea texto="+ Nacimientos" valor={x.nacimientos} />
            <Linea texto="+ Compras" valor={x.compras} />
            <Linea texto="− Descartes" valor={x.descartes} />
            <Linea texto="− Ventas" valor={x.ventas} />
            <Linea texto="− Muertes" valor={x.muertes} />
            <Linea texto="Inventario al final del mes" valor={x.final} fuerte />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Composición actual</CardTitle>
            <CardDescription>Real frente al ideal configurado en Finca.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-0 sm:px-5">
            <TablaComposicion
              titulo="Inventario bovino"
              filas={r.composicion.hato}
              total={r.composicion.totalHato}
              conIdeal
            />
            <TablaComposicion
              titulo="Ganado de carne y otras especies"
              filas={r.composicion.otras}
              total={r.composicion.totalOtras}
              conIdeal={false}
            />
          </CardContent>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Por lote</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-5">
            <TablaGrupo titulo="Lote" filas={r.porLote} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por potrero</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-5">
            <TablaGrupo titulo="Potrero" filas={r.porPotrero} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
