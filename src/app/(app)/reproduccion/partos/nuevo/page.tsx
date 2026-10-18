import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesParto } from "@/lib/servicios/reproduccion";
import { CAMPOS_PARTO } from "@/lib/validaciones/reproduccion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioParto } from "../../formularios";

export const metadata: Metadata = { title: "Registrar parto" };

export default async function NuevoParto({
  searchParams,
}: PageProps<"/reproduccion/partos/nuevo">) {
  await requierePermiso("reproduccion:registrar");
  const { hembra } = await searchParams;
  const { opciones, padres } = await opcionesParto();
  const hembraId = typeof hembra === "string" ? hembra : "";
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar parto"
        descripcion="Abre la lactancia de la vaca y crea las crías."
        volver={{ href: "/reproduccion/partos", texto: "Partos" }}
      />
      <FormularioParto
        valores={{
          ...valoresVacios(CAMPOS_PARTO),
          fecha: hoyISO(),
          tipo: "NORMAL",
          numeroCrias: "1",
          hembraId,
          toroId: padres[hembraId] ?? "",
        }}
        opcionesDinamicas={opciones}
        padres={padres}
      />
    </>
  );
}
