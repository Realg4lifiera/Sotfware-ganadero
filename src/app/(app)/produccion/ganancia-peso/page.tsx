import type { Metadata } from "next";
import Link from "next/link";
import { prismaBase } from "@/lib/db";
import { formatoFecha } from "@/lib/fechas";
import { formatoKg, formatoNumero } from "@/lib/formato";
import { resumenGanancia } from "@/lib/indicadores/peso";
import { promedio } from "@/lib/indicadores/reproduccion";
import { requierePermiso } from "@/lib/sesion";
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
import { EstadoVacio } from "@/components/estado-vacio";

export const metadata: Metadata = { title: "Ganancia de peso" };

const gdp = (g: number | null) => (g == null ? "—" : `${formatoNumero(g)} g/día`);

export default async function GananciaPeso() {
  await requierePermiso("produccion:leer");
  const animales = await prismaBase.animal.findMany({
    where: { deletedAt: null, estado: "ACTIVO", pesajes: { some: { deletedAt: null } } },
    orderBy: { numero: "asc" },
    select: {
      id: true,
      numero: true,
      nombre: true,
      lote: { select: { id: true, nombre: true } },
      pesajes: { where: { deletedAt: null }, select: { fecha: true, pesoKg: true } },
    },
  });
  const porLote = new Map<string, { nombre: string; filas: typeof filas }>();
  const filas = animales.map((a) => ({
    id: a.id,
    animal: a.nombre ? `${a.numero} · ${a.nombre}` : a.numero,
    ...resumenGanancia(a.pesajes.map((p) => ({ fecha: p.fecha, pesoKg: Number(p.pesoKg) })))!,
  }));
  animales.forEach((a, i) => {
    const k = a.lote?.id ?? "";
    if (!porLote.has(k)) porLote.set(k, { nombre: a.lote?.nombre ?? "Sin lote", filas: [] });
    porLote.get(k)!.filas.push(filas[i]);
  });
  const grupos = [...porLote.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return (
    <>
      <EncabezadoPagina
        titulo="Ganancia de peso"
        descripcion="Ganancia diaria (g/día) entre los dos últimos pesajes y desde el primero."
        volver={{ href: "/produccion", texto: "Producción" }}
      />
      {grupos.length === 0 ? (
        <EstadoVacio titulo="Aún no hay pesajes." />
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map((g) => (
            <Card key={g.nombre}>
              <CardHeader>
                <CardTitle>{g.nombre}</CardTitle>
                <CardDescription>
                  {g.filas.length} animales · ganancia promedio{" "}
                  {gdp(
                    promedio(g.filas.map((f) => f.gdpUltimo).filter((x): x is number => x != null)),
                  )}{" "}
                  (último intervalo)
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Animal</TableHead>
                      <TableHead className="text-right">Peso</TableHead>
                      <TableHead className="text-right">Último</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.filas.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <Link
                            href={`/animales/${f.id}?pestana=produccion`}
                            className="hover:text-primary font-medium hover:underline"
                          >
                            {f.animal}
                          </Link>
                          <span className="text-muted-foreground block text-xs">
                            {formatoFecha(f.fechaUltimo)} · {f.pesajes} pesajes
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatoKg(f.pesoActual)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {gdp(f.gdpUltimo)}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                          {gdp(f.gdpTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-muted-foreground mt-3 text-xs">
        Ganancia diaria de peso: (peso final − peso inicial) / días entre pesajes.
      </p>
    </>
  );
}
