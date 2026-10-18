import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Scale } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_METODO_PESAJE } from "@/lib/etiquetas";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoKg, formatoNumero } from "@/lib/formato";
import { gananciaDiariaGramos } from "@/lib/indicadores/peso";
import { promedio } from "@/lib/indicadores/reproduccion";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { Button } from "@/components/ui/button";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { eliminarPesaje } from "./acciones";

export const metadata: Metadata = { title: "Pesajes" };

export default async function PaginaPesajes({ searchParams }: PageProps<"/produccion/pesajes">) {
  const usuario = await requierePermiso("produccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const pesajes = await prismaBase.pesaje.findMany({
    where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: {
      animal: { select: { numero: true, nombre: true } },
      lote: { select: { nombre: true } },
    },
  });
  // Pesaje anterior de cada animal (para la ganancia diaria).
  const anteriores = await prismaBase.pesaje.findMany({
    where: {
      deletedAt: null,
      animalId: { in: [...new Set(pesajes.map((p) => p.animalId))] },
      fecha: { lt: hasta },
    },
    orderBy: { fecha: "asc" },
    select: { animalId: true, fecha: true, pesoKg: true },
  });
  const filas = pesajes.map((p) => {
    const previo = anteriores.filter((a) => a.animalId === p.animalId && a.fecha < p.fecha).at(-1);
    return {
      ...p,
      gdp: previo
        ? gananciaDiariaGramos(
            { fecha: previo.fecha, pesoKg: Number(previo.pesoKg) },
            { fecha: p.fecha, pesoKg: Number(p.pesoKg) },
          )
        : null,
    };
  });
  const registra = puede(usuario.rol, "produccion:registrar");
  const gdps = filas.map((f) => f.gdp).filter((g): g is number => g != null);
  return (
    <>
      <EncabezadoPagina
        titulo="Pesajes"
        descripcion={`Pesajes con báscula o cinta · ${nombreMes(mes)}`}
        volver={{ href: "/produccion", texto: "Producción" }}
        acciones={
          registra && (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/produccion/pesajes/nuevo">
                  <Plus /> Pesaje
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/produccion/pesajes/lote">
                  <Scale /> Pesar un lote
                </Link>
              </Button>
            </div>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/produccion/pesajes" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Pesajes"
          valor={formatoNumero(filas.length)}
          detalle={`${new Set(filas.map((f) => f.animalId)).size} animales`}
        />
        <TarjetaResumen
          titulo="Ganancia promedio"
          valor={gdps.length ? `${formatoNumero(promedio(gdps))} g/día` : "—"}
          detalle="Desde el pesaje anterior"
        />
      </div>
      {filas.length === 0 ? (
        <EstadoVacio titulo="No hay pesajes en este mes." />
      ) : (
        <ul className="bg-card divide-y overflow-hidden rounded-xl border">
          {filas.map((f) => (
            <li key={f.id} className="flex items-center gap-2 px-4 py-3">
              <Link
                href={`/animales/${f.animalId}?pestana=produccion`}
                className="flex min-w-0 flex-1 flex-col hover:underline"
              >
                <span className="font-semibold">
                  {f.animal.numero}
                  {f.animal.nombre ? ` · ${f.animal.nombre}` : ""}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {[formatoFecha(f.fecha), ETIQUETA_METODO_PESAJE[f.metodo], f.lote?.nombre]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </Link>
              <span className="text-right text-sm tabular-nums">
                {formatoKg(f.pesoKg)}
                {f.gdp != null && (
                  <span className="text-muted-foreground block text-xs">
                    {formatoNumero(f.gdp)} g/día
                  </span>
                )}
              </span>
              {registra && (
                <BotonEliminar
                  accion={eliminarPesaje.bind(null, f.id)}
                  titulo="¿Eliminar este pesaje?"
                  descripcion={`${f.animal.numero} · ${formatoFecha(f.fecha)} · ${formatoKg(f.pesoKg)}`}
                  destino="/produccion/pesajes"
                  compacto
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
