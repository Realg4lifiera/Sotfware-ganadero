import type { Metadata } from "next";
import Link from "next/link";
import { formatoFecha } from "@/lib/fechas";
import { formatoLitros, formatoNumero } from "@/lib/formato";
import { requierePermiso } from "@/lib/sesion";
import { lactanciasConProduccion } from "@/lib/servicios/lactancias";
import { promedio } from "@/lib/indicadores/reproduccion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";
import { TarjetaResumen } from "@/components/tarjeta-resumen";

export const metadata: Metadata = { title: "Lactancias" };

const litros = (n: number | null) => (n == null ? "—" : formatoLitros(n));

export default async function PaginaLactancias({
  searchParams,
}: PageProps<"/produccion/lactancias">) {
  await requierePermiso("produccion:leer");
  const abiertas = (await searchParams).ver !== "cerradas";
  const filas = await lactanciasConProduccion(abiertas);
  const conControl = filas.filter((f) => f.ultimoControl);
  return (
    <>
      <EncabezadoPagina
        titulo="Lactancias"
        descripcion="Días en leche y producción estimada con los controles lecheros."
        volver={{ href: "/produccion", texto: "Producción" }}
      />
      <div className="mb-4 flex gap-2">
        <Button variant={abiertas ? "default" : "outline"} size="sm" asChild>
          <Link href="/produccion/lactancias">En curso</Link>
        </Button>
        <Button variant={abiertas ? "outline" : "default"} size="sm" asChild>
          <Link href="/produccion/lactancias?ver=cerradas">Cerradas (12 meses)</Link>
        </Button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen
          titulo={abiertas ? "Vacas en producción" : "Lactancias cerradas"}
          valor={formatoNumero(filas.length)}
        />
        <TarjetaResumen
          titulo="Días en leche (promedio)"
          valor={formatoNumero(promedio(filas.map((f) => f.diasEnLeche)))}
        />
        <TarjetaResumen
          titulo={abiertas ? "Último control (promedio)" : "Producción 305 (promedio)"}
          valor={litros(
            promedio(
              abiertas
                ? conControl.map((f) => f.ultimoControl!.litros)
                : conControl.map((f) => f.ajustada305!),
            ),
          )}
          detalle={`${conControl.length} con control lechero`}
        />
      </div>
      {filas.length === 0 ? (
        <EstadoVacio titulo="No hay lactancias para mostrar." />
      ) : (
        <Card>
          <CardContent className="px-0 sm:px-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vaca</TableHead>
                  <TableHead className="text-right">DEL</TableHead>
                  <TableHead className="text-right">Últ. control</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Pico</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Producción</TableHead>
                  <TableHead className="hidden text-right md:table-cell">305 días</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link
                        href={`/animales/${f.vacaId}?pestana=produccion`}
                        className="hover:text-primary font-medium hover:underline"
                      >
                        {f.vaca}
                      </Link>
                      <span className="text-muted-foreground block text-xs">
                        Lact. {f.numero} · {formatoFecha(f.inicio)}
                        {f.fin ? ` a ${formatoFecha(f.fin)}` : ""}
                        {f.lote ? ` · ${f.lote}` : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{f.diasEnLeche}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {f.ultimoControl ? litros(f.ultimoControl.litros) : "—"}
                      {f.ultimoControl && (
                        <span className="text-muted-foreground block text-xs">
                          {formatoFecha(f.ultimoControl.fecha)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {f.pico ? `${litros(f.pico.litros)} · día ${f.pico.diasEnLeche}` : "—"}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {litros(f.total)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {litros(f.ajustada305)}
                      {f.proyectada && f.ajustada305 != null && (
                        <Badge variant="secondary" className="ml-1">
                          proy.
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <p className="text-muted-foreground mt-3 text-xs">
        Producción estimada entre controles y ajustada a 305 días de forma proporcional (pendiente
        de validar con el veterinario). «proy.»: lactancia con menos de 305 días cubiertos.
      </p>
    </>
  );
}
