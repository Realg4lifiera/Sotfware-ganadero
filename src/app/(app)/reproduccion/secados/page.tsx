import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoNumero } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { eventosAnulables, nombreHembra } from "@/lib/servicios/reproduccion";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { ListaEventos } from "../lista-eventos";

export const metadata: Metadata = { title: "Secados" };

export default async function Pagina({ searchParams }: PageProps<"/reproduccion/secados">) {
  const usuario = await requierePermiso("reproduccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const eventos = await prismaBase.secado.findMany({
    where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: { hembra: { select: { numero: true, nombre: true } } },
  });
  const registra = puede(usuario.rol, "reproduccion:registrar");
  const anulables = registra ? await eventosAnulables(eventos.map((e) => e.hembraId)) : new Set();
  return (
    <>
      <EncabezadoPagina
        titulo="Secados"
        descripcion={`Vacas secadas · ${nombreMes(mes)}`}
        volver={{ href: "/reproduccion", texto: "Reproducción" }}
        acciones={
          registra && (
            <Button asChild>
              <Link href="/reproduccion/secados/nuevo">
                <Plus /> Registrar secado
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/reproduccion/secados" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Secados" valor={formatoNumero(eventos.length)} />
      </div>
      <ListaEventos
        vacio="No hay registros en este mes."
        filas={eventos.map((e) => ({
          id: e.id,
          hembraId: e.hembraId,
          hembra: nombreHembra(e.hembra),
          detalle: [formatoFecha(e.fecha), e.observaciones].filter(Boolean).join(" · "),
          anulable: anulables.has(e.id),
        }))}
      />
    </>
  );
}
