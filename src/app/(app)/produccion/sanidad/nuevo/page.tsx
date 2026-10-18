import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesSanidad } from "@/lib/servicios/sanidad";
import { CAMPOS_SANITARIO } from "@/lib/validaciones/sanidad";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioSanitario } from "./formulario";

export const metadata: Metadata = { title: "Registrar evento sanitario" };

export default async function NuevoEventoSanitario({
  searchParams,
}: PageProps<"/produccion/sanidad/nuevo">) {
  await requierePermiso("sanidad:registrar");
  const { animal } = await searchParams;
  const animalId = typeof animal === "string" ? animal : "";
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar evento sanitario"
        volver={{ href: "/produccion/sanidad", texto: "Sanidad" }}
      />
      <FormularioSanitario
        valores={{
          ...valoresVacios(CAMPOS_SANITARIO),
          fecha: hoyISO(),
          tipo: "TRATAMIENTO",
          aplicaA: animalId ? "ANIMAL" : "LOTE",
          animalId,
        }}
        opcionesDinamicas={await opcionesSanidad()}
      />
    </>
  );
}
