import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { hembrasPara, permite } from "@/lib/servicios/reproduccion";
import { CAMPOS_DIAGNOSTICO } from "@/lib/validaciones/reproduccion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioDiagnostico } from "../../formularios";

export const metadata: Metadata = { title: "Registrar diagnóstico" };

export default async function NuevoDiagnostico({
  searchParams,
}: PageProps<"/reproduccion/diagnosticos/nuevo">) {
  await requierePermiso("reproduccion:registrar");
  const { hembra } = await searchParams;
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar diagnóstico de preñez"
        descripcion="Si sale preñada se calcula la fecha probable de parto."
        volver={{ href: "/reproduccion/diagnosticos", texto: "Diagnósticos" }}
      />
      <FormularioDiagnostico
        valores={{
          ...valoresVacios(CAMPOS_DIAGNOSTICO),
          fecha: hoyISO(),
          metodo: "PALPACION",
          hembraId: typeof hembra === "string" ? hembra : "",
        }}
        opcionesDinamicas={{ hembras: await hembrasPara(permite("DIAGNOSTICO")) }}
      />
    </>
  );
}
