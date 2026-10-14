import type { Metadata } from "next";
import Link from "next/link";
import { FileDown, Plus, Users } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { reporteManoObra } from "@/lib/dominio/nomina";
import { ETIQUETA_TIPO_CONTRATO } from "@/lib/etiquetas";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoCOP, formatoNumero } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { VistaNomina, type FilaPago } from "./vista-nomina";

export const metadata: Metadata = { title: "Nómina" };

export default async function PaginaNomina({ searchParams }: PageProps<"/costos/nomina">) {
  const usuario = await requierePermiso("costos:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const pagos = await prismaBase.pagoNomina.findMany({
    where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: { trabajador: true, centroCosto: { select: { nombre: true } } },
  });
  const n = (x: { toString(): string }) => Number(x);
  const r = reporteManoObra(
    pagos.map((p) => ({
      trabajadorId: p.trabajadorId,
      salario: n(p.salario),
      auxilioTransporte: n(p.auxilioTransporte),
      salud: n(p.salud),
      pension: n(p.pension),
      arl: n(p.arl),
      prima: n(p.prima),
      vacaciones: n(p.vacaciones),
      cesantias: n(p.cesantias),
      interesesCesantias: n(p.interesesCesantias),
      bonificacion: n(p.bonificacion),
    })),
  );
  const filas: FilaPago[] = pagos.map((p) => ({
    id: p.id,
    fecha: formatoFecha(p.fecha),
    fechaOrden: p.fecha.toISOString(),
    trabajador: p.trabajador.nombre,
    contrato: ETIQUETA_TIPO_CONTRATO[p.trabajador.tipoContrato],
    salarioBase: n(p.trabajador.salarioBase),
    centro: p.centroCosto.nombre,
    total: n(p.costoTotal),
  }));

  return (
    <>
      <EncabezadoPagina
        titulo="Nómina"
        descripcion={`Pagos de mano de obra · ${nombreMes(mes)}`}
        volver={{ href: "/costos", texto: "Costos" }}
        acciones={
          <>
            <Button asChild variant="outline">
              <Link href="/configuracion/trabajadores">
                <Users /> Trabajadores
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`/api/exportar/nomina?mes=${mes}`}>
                <FileDown /> Exportar Excel
              </a>
            </Button>
            {puede(usuario.rol, "costos:gestionar") && (
              <Button asChild>
                <Link href="/costos/nomina/nuevo">
                  <Plus /> Nuevo pago
                </Link>
              </Button>
            )}
          </>
        }
      />
      <SelectorMes mes={mes} ruta="/costos/nomina" />
      <h2 className="mb-2 text-lg font-semibold">Reporte de mano de obra</h2>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Empleados"
          valor={formatoNumero(r.empleados)}
          detalle={`${r.pagos} pagos`}
        />
        <TarjetaResumen
          titulo="Salarios"
          valor={formatoCOP(r.salarios)}
          detalle={`Auxilio ${formatoCOP(r.auxilioTransporte)}`}
        />
        <TarjetaResumen titulo="Bonificaciones" valor={formatoCOP(r.bonificaciones)} />
        <TarjetaResumen
          titulo="Prestaciones y seg. social"
          valor={formatoCOP(r.prestaciones + r.seguridadSocial)}
          detalle={`Prest. ${formatoCOP(r.prestaciones)} · S.S. ${formatoCOP(r.seguridadSocial)}`}
        />
        <TarjetaResumen titulo="Costo total" valor={formatoCOP(r.costoTotal)} />
      </div>
      <VistaNomina filas={filas} />
    </>
  );
}
