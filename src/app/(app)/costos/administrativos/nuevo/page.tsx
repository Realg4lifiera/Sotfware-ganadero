import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesCostoIndirecto } from "@/lib/servicios/costos-indirectos";
import { CAMPOS_COSTO_INDIRECTO_TODOS } from "@/lib/validaciones/costos-indirectos";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioCosto } from "../formulario-costo";

export const metadata: Metadata = { title: "Nuevo gasto administrativo" };

export default async function NuevoCosto() {
  await requierePermiso("costos:gestionar");
  const opciones = await opcionesCostoIndirecto();
  // Por defecto se propone la primera regla de prorrateo (si hay).
  const regla = opciones.reglas[0]?.valor ?? "";
  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo gasto administrativo"
        descripcion="Predial, servicios, arriendo, transporte de leche, gastos financieros…"
        volver={{ href: "/costos/administrativos", texto: "Gastos administrativos" }}
      />
      <FormularioCosto
        valores={{
          ...valoresVacios(CAMPOS_COSTO_INDIRECTO_TODOS),
          fecha: hoyISO(),
          reglaProrrateoId: regla,
        }}
        opcionesDinamicas={opciones}
      />
    </>
  );
}
