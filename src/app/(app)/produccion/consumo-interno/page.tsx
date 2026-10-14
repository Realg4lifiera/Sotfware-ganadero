import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_DESTINO_LECHE } from "@/lib/etiquetas";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoCOP, formatoLitros } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { DESTINOS, litrosDelPeriodo } from "@/lib/servicios/leche";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { ListaSimple } from "@/components/lista-simple";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";

export const metadata: Metadata = { title: "Consumo interno de leche" };

export default async function PaginaConsumo({
  searchParams,
}: PageProps<"/produccion/consumo-interno">) {
  const usuario = await requierePermiso("produccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const [registros, litros] = await Promise.all([
    prismaBase.consumoInternoLeche.findMany({
      where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
      orderBy: [{ fecha: "desc" }, { destino: "asc" }],
    }),
    litrosDelPeriodo(desde, hasta),
  ]);
  return (
    <>
      <EncabezadoPagina
        titulo="Consumo interno de leche"
        descripcion={`Leche que no se vende · ${nombreMes(mes)}`}
        volver={{ href: "/produccion", texto: "Producción" }}
        acciones={
          puede(usuario.rol, "leche:registrar") && (
            <Button asChild>
              <Link href="/produccion/consumo-interno/nuevo">
                <Plus /> Registrar consumo
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/produccion/consumo-interno" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5 [&>*]:min-w-0">
        {DESTINOS.map((d) => (
          <TarjetaResumen
            key={d}
            titulo={ETIQUETA_DESTINO_LECHE[d]}
            valor={formatoLitros(litros.porDestino[d])}
            detalle={
              d === "ARRIENDO" && litros.valorArriendo > 0
                ? formatoCOP(litros.valorArriendo)
                : undefined
            }
          />
        ))}
        <TarjetaResumen titulo="Total" valor={formatoLitros(litros.consumo)} />
      </div>
      <ListaSimple
        vacio="No hay consumo interno registrado en este mes."
        filas={registros.map((r) => ({
          id: r.id,
          href: `/produccion/consumo-interno/${r.id}`,
          titulo: `${ETIQUETA_DESTINO_LECHE[r.destino]}: ${formatoLitros(r.litros)}`,
          subtitulo: [formatoFecha(r.fecha), r.nota].filter(Boolean).join(" · "),
          valor: r.valor ? formatoCOP(r.valor) : "",
        }))}
      />
    </>
  );
}
