import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import { cargarOpciones, listarCatalogo, obtenerCatalogo } from "@/lib/catalogos/servidor";
import { puedeAlguno } from "@/lib/permisos";
import { requiereSesion } from "@/lib/sesion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { VistaCatalogo } from "./vista-catalogo";

export async function generateMetadata({
  params,
}: PageProps<"/configuracion/[catalogo]">): Promise<Metadata> {
  const { catalogo } = await params;
  return { title: obtenerCatalogo(catalogo)?.def.titulo ?? "Configuración" };
}

export default async function PaginaCatalogo({ params }: PageProps<"/configuracion/[catalogo]">) {
  const { catalogo } = await params;
  const cat = obtenerCatalogo(catalogo);
  if (!cat) notFound();
  const usuario = await requiereSesion();
  if (!puedeAlguno(usuario.rol, cat.def.permisos)) forbidden();

  const opcionesDinamicas = await cargarOpciones(cat.def);
  const filas = await listarCatalogo(cat.def, cat.srv, opcionesDinamicas);

  return (
    <>
      <EncabezadoPagina
        titulo={cat.def.titulo}
        descripcion={cat.def.descripcion}
        volver={{ href: "/configuracion", texto: "Configuración" }}
      />
      <VistaCatalogo clave={cat.def.clave} filas={filas} opcionesDinamicas={opcionesDinamicas} />
    </>
  );
}
