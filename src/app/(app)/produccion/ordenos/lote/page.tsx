import type { Metadata } from "next";
import { prismaBase } from "@/lib/db";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { CAMPOS_ORDENO_LOTE } from "@/lib/validaciones/ordenos";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioOrdenoLote } from "./formulario";

export const metadata: Metadata = { title: "Ordeño por lote" };

export default async function OrdenoLote() {
  await requierePermiso("produccion:registrar");
  const lotes = await prismaBase.lote.findMany({
    where: { deletedAt: null, activo: true },
    orderBy: [{ proposito: "asc" }, { nombre: "asc" }],
  });
  const lecheria = lotes.filter((l) => l.proposito === "LECHERIA");
  return (
    <>
      <EncabezadoPagina
        titulo="Ordeño por lote"
        volver={{ href: "/produccion/ordenos", texto: "Ordeños" }}
      />
      <FormularioOrdenoLote
        valores={{
          ...valoresVacios(CAMPOS_ORDENO_LOTE),
          fecha: hoyISO(),
          jornada: "MANANA",
          loteId: lecheria.length === 1 ? lecheria[0].id : "",
        }}
        opcionesDinamicas={{ lotes: lotes.map((l) => ({ valor: l.id, etiqueta: l.nombre })) }}
      />
    </>
  );
}
