import type { Metadata } from "next";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesPajilla } from "@/lib/servicios/pajillas";
import { CAMPO_EXISTENCIAS_INICIALES, CAMPOS_PAJILLA } from "@/lib/validaciones/pajillas";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioPajilla } from "../formularios";

export const metadata: Metadata = { title: "Nueva pajilla" };

export default async function NuevaPajilla() {
  await requierePermiso("reproduccion:gestionar");
  return (
    <>
      <EncabezadoPagina
        titulo="Nueva pajilla"
        descripcion="Si el toro no aparece, créalo en Configuración › Toros."
        volver={{ href: "/reproduccion/pajillas", texto: "Pajillas" }}
      />
      <FormularioPajilla
        valores={valoresVacios([...CAMPOS_PAJILLA, CAMPO_EXISTENCIAS_INICIALES])}
        opcionesDinamicas={await opcionesPajilla()}
      />
    </>
  );
}
