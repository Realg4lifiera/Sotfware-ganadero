import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { hembrasPara, permite } from "@/lib/servicios/reproduccion";
import { CAMPOS_DESCARTE } from "@/lib/validaciones/reproduccion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioDescarte } from "../../formularios";

export const metadata: Metadata = { title: "Registrar descarte" };

export default async function Nuevo({ searchParams }: PageProps<"/reproduccion/descartes/nuevo">) {
  await requierePermiso("reproduccion:registrar");
  const { hembra } = await searchParams;
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar descarte"
        descripcion="La hembra sale del hato (queda como descartada hasta su venta)."
        volver={{ href: "/reproduccion/descartes", texto: "Descartes" }}
      />
      <FormularioDescarte
        valores={{
          ...valoresVacios(CAMPOS_DESCARTE),
          fecha: hoyISO(),
          hembraId: typeof hembra === "string" ? hembra : "",
        }}
        opcionesDinamicas={{ hembras: await hembrasPara(permite("DESCARTE")) }}
      />
    </>
  );
}
