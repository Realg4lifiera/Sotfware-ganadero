import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { formatoNumero } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { ListaSimple } from "@/components/lista-simple";
import { TarjetaResumen } from "@/components/tarjeta-resumen";

export const metadata: Metadata = { title: "Pajillas" };

export default async function PaginaPajillas() {
  const usuario = await requierePermiso("reproduccion:leer");
  const pajillas = await prismaBase.pajilla.findMany({
    where: { deletedAt: null },
    orderBy: [{ activo: "desc" }, { toro: { nombre: "asc" } }],
    include: {
      toro: { select: { nombre: true, codigo: true } },
      raza: { select: { nombre: true } },
    },
  });
  const activas = pajillas.filter((p) => p.activo);
  const total = activas.reduce((s, p) => s + p.existencias, 0);
  const toros = new Set(activas.filter((p) => p.existencias > 0).map((p) => p.toroId)).size;
  return (
    <>
      <EncabezadoPagina
        titulo="Pajillas"
        descripcion="Inventario del termo por toro."
        volver={{ href: "/reproduccion", texto: "Reproducción" }}
        acciones={
          puede(usuario.rol, "reproduccion:gestionar") && (
            <Button asChild>
              <Link href="/reproduccion/pajillas/nuevo">
                <Plus /> Nueva pajilla
              </Link>
            </Button>
          )
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen titulo="Pajillas en el termo" valor={formatoNumero(total)} />
        <TarjetaResumen titulo="Toros disponibles" valor={formatoNumero(toros)} />
      </div>
      <ListaSimple
        vacio="No hay pajillas registradas."
        filas={pajillas.map((p) => ({
          id: p.id,
          href: `/reproduccion/pajillas/${p.id}`,
          titulo: p.toro.codigo ? `${p.toro.nombre} (${p.toro.codigo})` : p.toro.nombre,
          subtitulo: [p.raza?.nombre, p.codigo, p.ubicacionTermo, p.activo ? null : "inactiva"]
            .filter(Boolean)
            .join(" · "),
          valor: `${formatoNumero(p.existencias)} ${p.existencias === 1 ? "pajilla" : "pajillas"}`,
        }))}
      />
    </>
  );
}
