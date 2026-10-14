import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoCOP, formatoLitros } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { litrosDelPeriodo } from "@/lib/servicios/leche";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { ListaSimple } from "@/components/lista-simple";

export const metadata: Metadata = { title: "Entregas de leche" };

export default async function PaginaEntregas({ searchParams }: PageProps<"/produccion/entregas">) {
  const usuario = await requierePermiso("produccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const [entregas, litros] = await Promise.all([
    prismaBase.entregaLeche.findMany({
      where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      include: { comprador: { select: { nombre: true } } },
    }),
    litrosDelPeriodo(desde, hasta),
  ]);
  const dias = new Set(entregas.map((e) => e.fecha.toISOString())).size;
  return (
    <>
      <EncabezadoPagina
        titulo="Entregas de leche"
        descripcion={`Litros entregados al comprador · ${nombreMes(mes)}`}
        volver={{ href: "/produccion", texto: "Producción" }}
        acciones={
          puede(usuario.rol, "leche:registrar") && (
            <Button asChild>
              <Link href="/produccion/entregas/nuevo">
                <Plus /> Nueva entrega
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/produccion/entregas" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Litros vendidos"
          valor={formatoLitros(litros.vendidos)}
          detalle={`${dias} días con entrega`}
        />
        <TarjetaResumen
          titulo="Promedio por día"
          valor={dias ? formatoLitros(Math.round((litros.vendidos / dias) * 10) / 10) : "—"}
        />
        <TarjetaResumen titulo="Consumo interno" valor={formatoLitros(litros.consumo)} />
        <TarjetaResumen
          titulo="Litros producidos"
          valor={formatoLitros(litros.producidos)}
          detalle="Vendidos + consumo interno"
        />
      </div>
      <ListaSimple
        vacio="No hay entregas en este mes."
        filas={entregas.map((e) => ({
          id: e.id,
          href: `/produccion/entregas/${e.id}`,
          titulo: formatoLitros(e.litros),
          subtitulo: `${formatoFecha(e.fecha)} · ${e.comprador.nombre}`,
          valor: e.precioLitro ? `${formatoCOP(e.precioLitro)}/L` : "",
        }))}
      />
    </>
  );
}
