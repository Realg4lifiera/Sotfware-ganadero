import type { Metadata } from "next";
import { hoyISO } from "@/lib/fechas";
import { valoresVacios } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesCompradores } from "@/lib/servicios/leche";
import { CAMPOS_ENTREGA } from "@/lib/validaciones/leche";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioEntrega } from "../formulario-entrega";

export const metadata: Metadata = { title: "Nueva entrega de leche" };

export default async function NuevaEntrega() {
  await requierePermiso("leche:registrar");
  const opciones = await opcionesCompradores();
  return (
    <>
      <EncabezadoPagina
        titulo="Nueva entrega de leche"
        volver={{ href: "/produccion/entregas", texto: "Entregas de leche" }}
      />
      <FormularioEntrega
        valores={{
          ...valoresVacios(CAMPOS_ENTREGA),
          fecha: hoyISO(),
          // Con un solo comprador (lo usual: la cooperativa) se deja elegido.
          compradorId: opciones.compradores.length === 1 ? opciones.compradores[0].valor : "",
        }}
        opcionesDinamicas={opciones}
      />
    </>
  );
}
