import type { Metadata } from "next";
import { prismaBase } from "@/lib/db";
import { CAMPOS_FINCA } from "@/lib/catalogos/finca";
import { leerConfiguracion } from "@/lib/dominio/categoria";
import { valoresDesdeRegistro } from "@/lib/formularios/campos";
import { requierePermiso } from "@/lib/sesion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioFinca } from "./formulario-finca";

export const metadata: Metadata = { title: "Finca" };

export default async function PaginaFinca() {
  await requierePermiso("configuracion:gestionar");
  const finca = await prismaBase.finca.findUnique({ where: { id: 1 } });
  const config = leerConfiguracion(finca?.configuracion);
  const valores = {
    ...valoresDesdeRegistro(CAMPOS_FINCA, finca ?? {}),
    ivaEsCosto: config.costos.ivaEsCosto,
    ...Object.fromEntries(Object.entries(config.reproduccion).map(([c, v]) => [c, String(v)])),
    ...Object.fromEntries(
      Object.entries(config.cargaAnimal).map(([c, v]) => [`ua_${c}`, String(v).replace(".", ",")]),
    ),
    edadDesteteMeses: String(config.hato.edadDesteteMeses),
    edadNovillaMeses: String(config.hato.edadNovillaMeses),
    ...Object.fromEntries(
      Object.entries(config.hato.porcentajeIdeal).map(([c, v]) => [`ideal_${c}`, String(v)]),
    ),
  };
  return (
    <>
      <EncabezadoPagina
        titulo="Finca"
        descripcion="Datos generales, reglas del hato, costos y parámetros reproductivos."
        volver={{ href: "/configuracion", texto: "Configuración" }}
      />
      <FormularioFinca valores={valores} />
    </>
  );
}
