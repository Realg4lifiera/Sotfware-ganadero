import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesSuministro } from "@/lib/servicios/alimentacion";
import { CAMPOS_SUMINISTRO } from "@/lib/validaciones/alimentacion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioSuministro } from "./formulario";

export const metadata: Metadata = { title: "Registrar suministro" };

export default async function NuevoSuministro() {
  await requierePermiso("produccion:registrar");
  const { opciones, comprasPorInsumo } = await opcionesSuministro();
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar suministro"
        volver={{ href: "/produccion/alimentacion", texto: "Alimentación" }}
      />
      <FormularioSuministro
        valores={{ ...valoresVacios(CAMPOS_SUMINISTRO), fecha: hoyISO() }}
        opcionesDinamicas={opciones}
        comprasPorInsumo={comprasPorInsumo}
      />
    </>
  );
}
