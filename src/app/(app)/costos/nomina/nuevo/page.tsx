import type { Metadata } from "next";
import { valoresVacios } from "@/lib/formularios/campos";
import { hoyISO } from "@/lib/fechas";
import { requierePermiso } from "@/lib/sesion";
import { opcionesNomina, salariosBase } from "@/lib/servicios/nomina";
import { CAMPOS_PAGO } from "@/lib/validaciones/nomina";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioPago } from "../formulario-pago";

export const metadata: Metadata = { title: "Nuevo pago de nómina" };

export default async function NuevoPago() {
  await requierePermiso("costos:gestionar");
  const [opciones, salarios] = await Promise.all([opcionesNomina(), salariosBase()]);
  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo pago de nómina"
        descripcion="Registro del costo de mano de obra (no es nómina electrónica)."
        volver={{ href: "/costos/nomina", texto: "Nómina" }}
      />
      <FormularioPago
        valores={{
          ...valoresVacios(CAMPOS_PAGO),
          fecha: hoyISO(),
        }}
        opcionesDinamicas={opciones}
        salariosBase={salarios}
      />
    </>
  );
}
