import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesServicio } from "@/lib/servicios/reproduccion";
import { CAMPOS_SERVICIO } from "@/lib/validaciones/reproduccion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioServicio } from "../../formularios";

export const metadata: Metadata = { title: "Registrar servicio" };

export default async function NuevoServicio({
  searchParams,
}: PageProps<"/reproduccion/servicios/nuevo">) {
  await requierePermiso("reproduccion:registrar");
  const { hembra } = await searchParams;
  const { opciones, alertas, toroDePajilla } = await opcionesServicio();
  return (
    <>
      <EncabezadoPagina
        titulo="Registrar servicio"
        descripcion="Una inseminación descuenta la pajilla del termo."
        volver={{ href: "/reproduccion/servicios", texto: "Servicios" }}
      />
      <FormularioServicio
        valores={{
          ...valoresVacios(CAMPOS_SERVICIO),
          fecha: hoyISO(),
          tipo: "INSEMINACION",
          hembraId: typeof hembra === "string" ? hembra : "",
        }}
        opcionesDinamicas={opciones}
        alertas={alertas}
        toroDePajilla={toroDePajilla}
      />
    </>
  );
}
