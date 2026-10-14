import type { Metadata } from "next";
import Link from "next/link";
import { forbidden } from "next/navigation";
import { FileDown, Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { costoDeCompra } from "@/lib/dominio/compras";
import { ETIQUETA_ORIGEN_COMPRA } from "@/lib/etiquetas";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { puede, puedeAlguno } from "@/lib/permisos";
import { requiereSesion } from "@/lib/sesion";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { SelectorMes } from "@/components/selector-mes";
import { VistaGastos, type FilaGasto } from "./vista-gastos";

export const metadata: Metadata = { title: "Compras y gastos" };

export default async function PaginaGastos({ searchParams }: PageProps<"/costos/gastos">) {
  const usuario = await requiereSesion();
  if (!puedeAlguno(usuario.rol, ["costos:leer", "gasto:registrar"])) forbidden();
  const verTodo = puede(usuario.rol, "costos:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);

  const [gastos, config] = await Promise.all([
    prismaBase.gasto.findMany({
      where: {
        deletedAt: null,
        fecha: { gte: desde, lt: hasta },
        // Quien solo registra gastos de campo ve los suyos.
        ...(verTodo ? {} : { createdById: usuario.id }),
      },
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      include: {
        categoria: { select: { nombre: true, rubro: { select: { nombre: true } } } },
        centroCosto: { select: { nombre: true } },
        proveedor: { select: { nombre: true } },
        animal: { select: { numero: true } },
        lote: { select: { nombre: true } },
      },
    }),
    obtenerConfiguracionFinca(),
  ]);
  const soportes = await prismaBase.adjunto.groupBy({
    by: ["entidadId"],
    where: { entidad: "Gasto", deletedAt: null, entidadId: { in: gastos.map((g) => g.id) } },
    _count: true,
  });
  const conSoporte = new Map(soportes.map((s) => [s.entidadId, s._count]));
  const ivaEsCosto = config.costos.ivaEsCosto;

  const filas: FilaGasto[] = gastos.map((g) => ({
    id: g.id,
    fecha: formatoFecha(g.fecha),
    fechaOrden: g.fecha.toISOString(),
    descripcion: g.descripcion,
    proveedor: g.proveedor?.nombre ?? "",
    categoria: g.categoria.nombre,
    rubro: g.categoria.rubro.nombre,
    centro: g.centroCosto.nombre,
    asignacion: g.animal ? `Animal ${g.animal.numero}` : (g.lote?.nombre ?? ""),
    origen: ETIQUETA_ORIGEN_COMPRA[g.origen],
    total: Number(g.valorTotal),
    iva: Number(g.valorIva),
    costo: costoDeCompra(
      { valorTotal: Number(g.valorTotal), valorIva: Number(g.valorIva) },
      ivaEsCosto,
    ),
    soportes: conSoporte.get(g.id) ?? 0,
  }));

  return (
    <>
      <EncabezadoPagina
        titulo="Compras y gastos"
        descripcion={`${verTodo ? "Compras y gastos directos" : "Tus gastos de campo"} · ${nombreMes(mes)}`}
        volver={{ href: "/costos", texto: "Costos" }}
        acciones={
          <>
            {verTodo && (
              <Button asChild variant="outline">
                <a href={`/api/exportar/gastos?mes=${mes}`}>
                  <FileDown /> Exportar Excel
                </a>
              </Button>
            )}
            {puede(usuario.rol, "gasto:registrar") && (
              <Button asChild>
                <Link href="/costos/gastos/nuevo">
                  <Plus /> Nuevo gasto
                </Link>
              </Button>
            )}
          </>
        }
      />
      <SelectorMes mes={mes} ruta="/costos/gastos" />
      <VistaGastos filas={filas} ivaEsCosto={ivaEsCosto} />
    </>
  );
}
