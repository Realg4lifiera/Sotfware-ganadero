import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { hembrasPara, permite } from "@/lib/servicios/reproduccion";
import { CAMPOS_CELO } from "@/lib/validaciones/reproduccion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioCelo } from "../../formularios";

export const metadata: Metadata = { title: "Registrar celo" };

export default async function NuevoCelo({ searchParams }: PageProps<"/reproduccion/celos/nuevo">) {
  await requierePermiso("reproduccion:registrar");
  const { hembra } = await searchParams;
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar celo"
        volver={{ href: "/reproduccion/celos", texto: "Celos" }}
      />
      <FormularioCelo
        valores={{
          ...valoresVacios(CAMPOS_CELO),
          fecha: hoyISO(),
          hembraId: typeof hembra === "string" ? hembra : "",
        }}
        opcionesDinamicas={{ hembras: await hembrasPara(permite("CELO")) }}
      />
    </>
  );
}
