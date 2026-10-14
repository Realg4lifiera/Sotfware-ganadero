import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesIngreso } from "@/lib/servicios/ingresos";
import { CAMPOS_INGRESO } from "@/lib/validaciones/ingresos";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioIngreso } from "../formulario-ingreso";

export const metadata: Metadata = { title: "Nuevo ingreso" };

export default async function NuevoIngreso() {
  await requierePermiso("costos:gestionar");
  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo ingreso"
        descripcion="Venta de leche u otros ingresos. Las ventas de animales se registran desde su hoja de vida."
        volver={{ href: "/costos/ingresos", texto: "Ingresos" }}
      />
      <FormularioIngreso
        valores={{ ...valoresVacios(CAMPOS_INGRESO), fecha: hoyISO(), concepto: "Venta de leche" }}
        opcionesDinamicas={await opcionesIngreso()}
      />
    </>
  );
}
