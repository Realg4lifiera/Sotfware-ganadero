import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { formatoFechaHora, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoNumero } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { eventosAnulables, nombreHembra } from "@/lib/servicios/reproduccion";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { ListaEventos } from "../lista-eventos";

export const metadata: Metadata = { title: "Celos" };

export default async function PaginaCelos({ searchParams }: PageProps<"/reproduccion/celos">) {
  const usuario = await requierePermiso("reproduccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const celos = await prismaBase.celo.findMany({
    where: {
      deletedAt: null,
      // El mes se cuenta en hora de Bogotá (UTC−5).
      fechaHora: {
        gte: new Date(desde.getTime() + 5 * 3_600_000),
        lt: new Date(hasta.getTime() + 5 * 3_600_000),
      },
    },
    orderBy: { fechaHora: "desc" },
    include: {
      hembra: { select: { numero: true, nombre: true } },
      servicio: { select: { id: true, deletedAt: true } },
    },
  });
  const registra = puede(usuario.rol, "reproduccion:registrar");
  const anulables = registra ? await eventosAnulables(celos.map((c) => c.hembraId)) : new Set();
  const servidos = celos.filter((c) => c.servicio && !c.servicio.deletedAt).length;
  return (
    <>
      <EncabezadoPagina
        titulo="Celos"
        descripcion={`Celos detectados · ${nombreMes(mes)}`}
        volver={{ href: "/reproduccion", texto: "Reproducción" }}
        acciones={
          registra && (
            <Button asChild>
              <Link href="/reproduccion/celos/nuevo">
                <Plus /> Registrar celo
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/reproduccion/celos" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Celos" valor={formatoNumero(celos.length)} />
        <TarjetaResumen titulo="Con servicio" valor={formatoNumero(servidos)} />
      </div>
      <ListaEventos
        vacio="No hay celos en este mes."
        filas={celos.map((c) => ({
          id: c.id,
          hembraId: c.hembraId,
          hembra: nombreHembra(c.hembra),
          detalle: [
            formatoFechaHora(c.fechaHora),
            c.servicio && !c.servicio.deletedAt ? "servida" : null,
            c.observaciones,
          ]
            .filter(Boolean)
            .join(" · "),
          anulable: anulables.has(c.id),
        }))}
      />
    </>
  );
}
