import type { Metadata } from "next";
import Link from "next/link";
import { Plus, SplitSquareHorizontal } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { cuotaEnMes } from "@/lib/dominio/prorrateo";
import { ETIQUETA_PERIODICIDAD } from "@/lib/etiquetas";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoCOP, formatoLitros } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { VistaCostos, type FilaCosto } from "./vista-costos";

export const metadata: Metadata = { title: "Gastos administrativos" };

export default async function PaginaAdministrativos({
  searchParams,
}: PageProps<"/costos/administrativos">) {
  const usuario = await requierePermiso("costos:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  // Un gasto anual iniciado hasta 11 meses antes todavía tiene cuota en este mes.
  const haceUnAnio = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() - 11, 1));
  const costos = await prismaBase.costoIndirecto.findMany({
    where: { deletedAt: null, fecha: { gte: haceUnAnio, lt: hasta } },
    orderBy: [{ fecha: "desc" }],
    include: {
      categoria: { include: { rubro: { select: { nombre: true } } } },
      centroCosto: { select: { nombre: true } },
      reglaProrrateo: { select: { nombre: true } },
    },
  });
  const filas: FilaCosto[] = costos
    .map((c) => ({
      c,
      cuota: cuotaEnMes(
        { fecha: c.fecha, periodicidad: c.periodicidad, valorTotal: Number(c.valorTotal) },
        mes,
      ),
    }))
    .filter((x) => x.cuota > 0)
    .map(({ c, cuota }) => ({
      id: c.id,
      concepto: c.categoria.nombre,
      rubro: c.categoria.rubro.nombre,
      inicio: formatoFecha(c.fecha),
      periodo: ETIQUETA_PERIODICIDAD[c.periodicidad],
      total: Number(c.valorTotal),
      cuota,
      asignacion: c.centroCosto?.nombre ?? `Regla: ${c.reglaProrrateo?.nombre ?? "—"}`,
      litros: c.litros ? formatoLitros(c.litros) : "",
      porLitro: c.litros && Number(c.litros) > 0 ? Number(c.valorTotal) / Number(c.litros) : null,
    }));
  const total = filas.reduce((s, f) => s + f.cuota, 0);
  const anuales = filas.filter((f) => f.periodo !== "Mensual").reduce((s, f) => s + f.cuota, 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Gastos administrativos"
        descripcion={`Costos indirectos repartidos por mes · ${nombreMes(mes)}`}
        volver={{ href: "/costos", texto: "Costos" }}
        acciones={
          <>
            <Button asChild variant="outline">
              <Link href="/costos/administrativos/reglas">
                <SplitSquareHorizontal /> Reglas de prorrateo
              </Link>
            </Button>
            {puede(usuario.rol, "costos:gestionar") && (
              <Button asChild>
                <Link href="/costos/administrativos/nuevo">
                  <Plus /> Nuevo gasto
                </Link>
              </Button>
            )}
          </>
        }
      />
      <SelectorMes mes={mes} ruta="/costos/administrativos" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Total del mes"
          valor={formatoCOP(total)}
          detalle={`${filas.length} conceptos`}
        />
        <TarjetaResumen
          titulo="De gastos de varios meses"
          valor={formatoCOP(anuales)}
          detalle="Cuota mensual de predial, seguros…"
        />
      </div>
      <VistaCostos filas={filas} />
    </>
  );
}
