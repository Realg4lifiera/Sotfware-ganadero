import type { Metadata } from "next";
import { prismaBase } from "@/lib/db";
import { hoyISO } from "@/lib/fechas";
import { requierePermiso } from "@/lib/sesion";
import { animalesParaPesar } from "@/lib/servicios/pesajes";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";
import { PlanillaPesaje } from "../formularios";
import { FiltrosPesajeLote } from "./filtros";

export const metadata: Metadata = { title: "Pesaje por lote" };

export default async function PesajeLote({ searchParams }: PageProps<"/produccion/pesajes/lote">) {
  await requierePermiso("produccion:registrar");
  const sp = await searchParams;
  const lotes = await prismaBase.lote.findMany({
    where: { deletedAt: null, activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });
  const loteId = typeof sp.lote === "string" && lotes.some((l) => l.id === sp.lote) ? sp.lote : "";
  const fecha =
    typeof sp.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) && sp.fecha <= hoyISO()
      ? sp.fecha
      : hoyISO();
  const metodo = sp.metodo === "CINTA" ? "CINTA" : "BASCULA";
  const animales = loteId ? await animalesParaPesar(loteId) : [];
  return (
    <>
      <EncabezadoPagina
        titulo="Pesaje por lote"
        descripcion="Escribe solo los pesos tomados; las casillas vacías se ignoran."
        volver={{ href: "/produccion/pesajes", texto: "Pesajes" }}
      />
      <FiltrosPesajeLote lotes={lotes} loteId={loteId} fecha={fecha} metodo={metodo} />
      {!loteId ? (
        <EstadoVacio titulo="Elige el lote que vas a pesar." />
      ) : animales.length === 0 ? (
        <EstadoVacio titulo="El lote no tiene animales activos." />
      ) : (
        <PlanillaPesaje
          key={`${loteId}-${fecha}-${metodo}`}
          fecha={fecha}
          metodo={metodo}
          animales={animales}
        />
      )}
    </>
  );
}
