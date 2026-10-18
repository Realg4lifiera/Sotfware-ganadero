import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { hembrasPara, permite } from "@/lib/servicios/reproduccion";
import { CAMPOS_SECADO } from "@/lib/validaciones/reproduccion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioSecado } from "../../formularios";

export const metadata: Metadata = { title: "Registrar secado" };

export default async function Nuevo({ searchParams }: PageProps<"/reproduccion/secados/nuevo">) {
  await requierePermiso("reproduccion:registrar");
  const { hembra } = await searchParams;
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar secado"
        descripcion="Cierra la lactancia de la vaca."
        volver={{ href: "/reproduccion/secados", texto: "Secados" }}
      />
      <FormularioSecado
        valores={{
          ...valoresVacios(CAMPOS_SECADO),
          fecha: hoyISO(),
          hembraId: typeof hembra === "string" ? hembra : "",
        }}
        opcionesDinamicas={{ hembras: await hembrasPara(permite("SECADO")) }}
      />
    </>
  );
}
