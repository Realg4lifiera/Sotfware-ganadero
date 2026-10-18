import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesPesaje } from "@/lib/servicios/pesajes";
import { CAMPOS_PESAJE } from "@/lib/validaciones/pesajes";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioPesaje } from "../formularios";

export const metadata: Metadata = { title: "Registrar pesaje" };

export default async function NuevoPesaje({
  searchParams,
}: PageProps<"/produccion/pesajes/nuevo">) {
  await requierePermiso("produccion:registrar");
  const { animal } = await searchParams;
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar pesaje"
        descripcion="Si el animal ya se pesó ese día, se corrige el peso."
        volver={{ href: "/produccion/pesajes", texto: "Pesajes" }}
      />
      <FormularioPesaje
        valores={{
          ...valoresVacios(CAMPOS_PESAJE),
          fecha: hoyISO(),
          metodo: "BASCULA",
          animalId: typeof animal === "string" ? animal : "",
        }}
        opcionesDinamicas={await opcionesPesaje()}
      />
    </>
  );
}
