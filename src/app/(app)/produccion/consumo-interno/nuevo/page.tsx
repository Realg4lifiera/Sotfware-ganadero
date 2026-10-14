import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { CAMPOS_CONSUMO_LOTE } from "@/lib/validaciones/leche";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioConsumos } from "../formularios";

export const metadata: Metadata = { title: "Registrar consumo interno" };

export default async function NuevoConsumo() {
  await requierePermiso("leche:registrar");
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar consumo interno"
        descripcion="Leche para trabajadores, terneras, retiro y arriendo."
        volver={{ href: "/produccion/consumo-interno", texto: "Consumo interno" }}
      />
      <FormularioConsumos valores={{ ...valoresVacios(CAMPOS_CONSUMO_LOTE), fecha: hoyISO() }} />
    </>
  );
}
