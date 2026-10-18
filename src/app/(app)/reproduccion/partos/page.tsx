import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_TIPO_PARTO } from "@/lib/etiquetas";
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

export const metadata: Metadata = { title: "Partos" };

export default async function PaginaPartos({ searchParams }: PageProps<"/reproduccion/partos">) {
  const usuario = await requierePermiso("reproduccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const partos = await prismaBase.parto.findMany({
    where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: {
      hembra: { select: { numero: true, nombre: true } },
      toro: { select: { nombre: true } },
      crias: { where: { deletedAt: null }, select: { numero: true, sexo: true } },
    },
  });
  const registra = puede(usuario.rol, "reproduccion:registrar");
  const anulables = registra ? await eventosAnulables(partos.map((p) => p.hembraId)) : new Set();
  const crias = partos.flatMap((p) => p.crias);
  const hembras = crias.filter((c) => c.sexo === "HEMBRA").length;
  return (
    <>
      <EncabezadoPagina
        titulo="Partos"
        descripcion={`Partos y crías · ${nombreMes(mes)}`}
        volver={{ href: "/reproduccion", texto: "Reproducción" }}
        acciones={
          registra && (
            <Button asChild>
              <Link href="/reproduccion/partos/nuevo">
                <Plus /> Registrar parto
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/reproduccion/partos" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Partos" valor={formatoNumero(partos.length)} />
        <TarjetaResumen
          titulo="Crías"
          valor={formatoNumero(crias.length)}
          detalle={`${hembras} hembras · ${crias.length - hembras} machos`}
        />
      </div>
      <ListaEventos
        vacio="No hay partos en este mes."
        filas={partos.map((p) => ({
          id: p.id,
          hembraId: p.hembraId,
          hembra: nombreHembra(p.hembra),
          detalle: [
            formatoFecha(p.fecha),
            ETIQUETA_TIPO_PARTO[p.tipo],
            p.toro ? `padre ${p.toro.nombre}` : null,
            p.crias.length
              ? `crías ${p.crias.map((c) => `${c.numero} (${c.sexo === "HEMBRA" ? "H" : "M"})`).join(", ")}`
              : "sin crías",
          ]
            .filter(Boolean)
            .join(" · "),
          anulable: anulables.has(p.id),
        }))}
      />
    </>
  );
}
