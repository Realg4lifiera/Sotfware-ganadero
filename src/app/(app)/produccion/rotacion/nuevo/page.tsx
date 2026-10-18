import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesRotacion } from "@/lib/servicios/rotacion";
import { CAMPOS_ROTACION } from "@/lib/validaciones/rotacion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioRotacion } from "./formulario";

export const metadata: Metadata = { title: "Rotar lote" };

export default async function NuevaRotacion({
  searchParams,
}: PageProps<"/produccion/rotacion/nuevo">) {
  await requierePermiso("produccion:registrar");
  const { potrero } = await searchParams;
  return (
    <>
      <EncabezadoPagina
        titulo="Rotar lote"
        volver={{ href: "/produccion/rotacion", texto: "Potreros y rotación" }}
      />
      <FormularioRotacion
        valores={{
          ...valoresVacios(CAMPOS_ROTACION),
          fecha: hoyISO(),
          potreroId: typeof potrero === "string" ? potrero : "",
        }}
        opcionesDinamicas={await opcionesRotacion()}
      />
    </>
  );
}
