import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_TIPO_INGRESO } from "@/lib/etiquetas";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoCOP, formatoLitros } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { VistaIngresos, type FilaIngreso } from "./vista-ingresos";

export const metadata: Metadata = { title: "Ingresos" };

export default async function PaginaIngresos({ searchParams }: PageProps<"/costos/ingresos">) {
  const usuario = await requierePermiso("costos:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const ingresos = await prismaBase.ingreso.findMany({
    where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    include: { comprador: { select: { nombre: true } }, animal: { select: { numero: true } } },
  });
  const filas: FilaIngreso[] = ingresos.map((i) => ({
    id: i.id,
    fecha: formatoFecha(i.fecha),
    fechaOrden: i.fecha.toISOString(),
    concepto: i.concepto,
    tipo: ETIQUETA_TIPO_INGRESO[i.tipo],
    detalle: [i.comprador?.nombre, i.animal && `Animal ${i.animal.numero}`]
      .filter(Boolean)
      .join(" · "),
    cantidad: Number(i.cantidad),
    precio: Number(i.precioUnitario),
    total: Number(i.total),
  }));
  const suma = (t: string) =>
    ingresos.filter((i) => i.tipo === t).reduce((s, i) => s + Number(i.total), 0);
  const leche = ingresos.filter((i) => i.tipo === "VENTA_LECHE");
  const litros = leche.reduce((s, i) => s + Number(i.cantidad), 0);
  return (
    <>
      <EncabezadoPagina
        titulo="Ingresos"
        descripcion={`Venta de leche, de animales y otros · ${nombreMes(mes)}`}
        volver={{ href: "/costos", texto: "Costos" }}
        acciones={
          puede(usuario.rol, "costos:gestionar") && (
            <Button asChild>
              <Link href="/costos/ingresos/nuevo">
                <Plus /> Nuevo ingreso
              </Link>
            </Button>
          )
        }
      />
      <SelectorMes mes={mes} ruta="/costos/ingresos" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Total del mes"
          valor={formatoCOP(filas.reduce((s, f) => s + f.total, 0))}
        />
        <TarjetaResumen
          titulo="Venta de leche"
          valor={formatoCOP(suma("VENTA_LECHE"))}
          detalle={
            litros > 0
              ? `${formatoLitros(litros)} · ${formatoCOP(suma("VENTA_LECHE") / litros)}/L`
              : undefined
          }
        />
        <TarjetaResumen titulo="Venta de animales" valor={formatoCOP(suma("VENTA_ANIMAL"))} />
        <TarjetaResumen titulo="Otros ingresos" valor={formatoCOP(suma("OTRO"))} />
      </div>
      <VistaIngresos filas={filas} />
    </>
  );
}
