import type { Metadata } from "next";
import { prismaBase } from "@/lib/db";
import { comparativoPresupuesto, porcentajeEjecucion } from "@/lib/dominio/presupuesto";
import { mesDesdeParametro, nombreMes } from "@/lib/fechas";
import { formatoCOP, formatoPorcentaje } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { costosDelMes, rubrosOrdenados } from "@/lib/servicios/costos";
import { presupuestoDelMes } from "@/lib/servicios/presupuesto";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { VistaPresupuesto } from "./vista-presupuesto";

export const metadata: Metadata = { title: "Presupuesto" };

export default async function PaginaPresupuesto({
  searchParams,
}: PageProps<"/costos/presupuesto">) {
  const usuario = await requierePermiso("costos:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const [rubros, categorias, presupuesto, lineas] = await Promise.all([
    rubrosOrdenados(),
    prismaBase.categoriaGasto.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, rubroId: true },
    }),
    presupuestoDelMes(mes),
    costosDelMes(mes),
  ]);
  const comparativo = comparativoPresupuesto(rubros, categorias, presupuesto, lineas).filter(
    (r) => r.filas.length > 0,
  );
  const presupuestado = comparativo.reduce((s, r) => s + r.presupuestado, 0);
  const ejecutado = comparativo.reduce((s, r) => s + r.ejecutado, 0);
  const pct = porcentajeEjecucion(presupuestado, ejecutado);
  return (
    <>
      <EncabezadoPagina
        titulo="Presupuesto"
        descripcion={`Presupuestado vs. ejecutado · ${nombreMes(mes)}`}
        volver={{ href: "/costos", texto: "Costos" }}
      />
      <SelectorMes mes={mes} ruta="/costos/presupuesto" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Presupuestado" valor={formatoCOP(Math.round(presupuestado))} />
        <TarjetaResumen
          titulo="Ejecutado"
          valor={formatoCOP(Math.round(ejecutado))}
          detalle="Compras, administrativos, nómina y depreciación"
        />
        <TarjetaResumen
          titulo="Diferencia"
          valor={formatoCOP(Math.round(presupuestado - ejecutado))}
          detalle={presupuestado - ejecutado < 0 ? "Por encima del presupuesto" : "Disponible"}
        />
        <TarjetaResumen titulo="Ejecución" valor={pct === null ? "—" : formatoPorcentaje(pct)} />
      </div>
      <VistaPresupuesto
        key={mes}
        mes={mes}
        rubros={comparativo}
        editable={puede(usuario.rol, "costos:gestionar")}
      />
    </>
  );
}
