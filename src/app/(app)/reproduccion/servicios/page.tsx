import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_TIPO_SERVICIO } from "@/lib/etiquetas";
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

export const metadata: Metadata = { title: "Servicios" };

export default async function PaginaServicios({
  searchParams,
}: PageProps<"/reproduccion/servicios">) {
  const usuario = await requierePermiso("reproduccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const servicios = await prismaBase.servicio.findMany({
    where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: {
      hembra: { select: { numero: true, nombre: true } },
      toro: { select: { nombre: true } },
    },
  });
  const registra = puede(usuario.rol, "reproduccion:registrar");
  const anulables = registra ? await eventosAnulables(servicios.map((s) => s.hembraId)) : new Set();
  const ia = servicios.filter((s) => s.tipo === "INSEMINACION").length;
  return (
    <>
      <EncabezadoPagina
        titulo="Servicios"
        descripcion={`Montas e inseminaciones · ${nombreMes(mes)}`}
        volver={{ href: "/reproduccion", texto: "Reproducción" }}
        acciones={
          registra && (
            <Button asChild>
              <Link href="/reproduccion/servicios/nuevo">
                <Plus /> Registrar servicio
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/reproduccion/servicios" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Servicios" valor={formatoNumero(servicios.length)} />
        <TarjetaResumen
          titulo="Inseminaciones"
          valor={formatoNumero(ia)}
          detalle={`${formatoNumero(servicios.length - ia)} montas naturales`}
        />
      </div>
      <ListaEventos
        vacio="No hay servicios en este mes."
        filas={servicios.map((s) => ({
          id: s.id,
          hembraId: s.hembraId,
          hembra: nombreHembra(s.hembra),
          detalle: [
            formatoFecha(s.fecha),
            ETIQUETA_TIPO_SERVICIO[s.tipo],
            s.toro?.nombre,
            s.inseminador,
          ]
            .filter(Boolean)
            .join(" · "),
          valor: `${s.numeroServicio}.º`,
          anulable: anulables.has(s.id),
        }))}
      />
    </>
  );
}
