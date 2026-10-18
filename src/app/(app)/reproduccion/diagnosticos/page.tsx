import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_METODO_DIAGNOSTICO, ETIQUETA_RESULTADO_DIAGNOSTICO } from "@/lib/etiquetas";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoNumero, formatoPorcentaje } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { eventosAnulables, nombreHembra } from "@/lib/servicios/reproduccion";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { ListaEventos } from "../lista-eventos";

export const metadata: Metadata = { title: "Diagnósticos de preñez" };

export default async function PaginaDiagnosticos({
  searchParams,
}: PageProps<"/reproduccion/diagnosticos">) {
  const usuario = await requierePermiso("reproduccion:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const diagnosticos = await prismaBase.diagnosticoPrenez.findMany({
    where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: { hembra: { select: { numero: true, nombre: true } } },
  });
  const registra = puede(usuario.rol, "reproduccion:registrar");
  const anulables = registra
    ? await eventosAnulables(diagnosticos.map((d) => d.hembraId))
    : new Set();
  const positivos = diagnosticos.filter((d) => d.resultado === "PRENADA").length;
  return (
    <>
      <EncabezadoPagina
        titulo="Diagnósticos de preñez"
        descripcion={`Palpaciones y ecografías · ${nombreMes(mes)}`}
        volver={{ href: "/reproduccion", texto: "Reproducción" }}
        acciones={
          registra && (
            <Button asChild>
              <Link href="/reproduccion/diagnosticos/nuevo">
                <Plus /> Registrar diagnóstico
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/reproduccion/diagnosticos" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Diagnósticos" valor={formatoNumero(diagnosticos.length)} />
        <TarjetaResumen
          titulo="Preñadas"
          valor={formatoNumero(positivos)}
          detalle={
            diagnosticos.length
              ? `${formatoPorcentaje(positivos / diagnosticos.length, 0)} de los diagnósticos`
              : undefined
          }
        />
      </div>
      <ListaEventos
        vacio="No hay diagnósticos en este mes."
        filas={diagnosticos.map((d) => ({
          id: d.id,
          hembraId: d.hembraId,
          hembra: nombreHembra(d.hembra),
          detalle: [
            formatoFecha(d.fecha),
            ETIQUETA_METODO_DIAGNOSTICO[d.metodo],
            d.fechaProbableParto ? `parto ${formatoFecha(d.fechaProbableParto)}` : null,
            d.veterinario,
          ]
            .filter(Boolean)
            .join(" · "),
          valor: ETIQUETA_RESULTADO_DIAGNOSTICO[d.resultado],
          anulable: anulables.has(d.id),
        }))}
      />
    </>
  );
}
