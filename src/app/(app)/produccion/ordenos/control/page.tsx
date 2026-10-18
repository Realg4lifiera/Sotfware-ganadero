import type { Metadata } from "next";
import { prismaBase } from "@/lib/db";
import { fechaDesdeISO, formatoFecha, hoyISO } from "@/lib/fechas";
import { requierePermiso } from "@/lib/sesion";
import { vacasEnLactancia } from "@/lib/servicios/ordenos";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";
import { SelectorFecha } from "./selector-fecha";
import { Planilla } from "./planilla";

export const metadata: Metadata = { title: "Control lechero" };

export default async function ControlLechero({
  searchParams,
}: PageProps<"/produccion/ordenos/control">) {
  await requierePermiso("produccion:registrar");
  const p = (await searchParams).fecha;
  const iso =
    typeof p === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p) && p <= hoyISO() ? p : hoyISO();
  const fecha = fechaDesdeISO(iso);
  const [vacas, registros] = await Promise.all([
    vacasEnLactancia(fecha),
    prismaBase.registroOrdeno.findMany({
      where: { fecha, deletedAt: null, animalId: { not: null } },
      select: { animalId: true, jornada: true, litros: true },
    }),
  ]);
  const valores = Object.fromEntries(
    registros.map((r) => [
      `${r.animalId}_${r.jornada}`,
      String(Number(r.litros)).replace(".", ","),
    ]),
  );
  return (
    <>
      <EncabezadoPagina
        titulo="Control lechero"
        descripcion={`Litros por vaca · ${formatoFecha(fecha)}`}
        volver={{ href: "/produccion/ordenos", texto: "Ordeños" }}
      />
      <SelectorFecha fecha={iso} />
      {vacas.length === 0 ? (
        <EstadoVacio titulo="No había vacas en lactancia ese día." />
      ) : (
        <Planilla key={iso} fecha={iso} vacas={vacas} valores={valores} />
      )}
    </>
  );
}
