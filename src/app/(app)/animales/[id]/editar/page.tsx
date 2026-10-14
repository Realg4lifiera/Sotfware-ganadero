import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismaBase } from "@/lib/db";
import { valoresDesdeRegistro } from "@/lib/formularios/campos";
import { hoyISO } from "@/lib/fechas";
import { requierePermiso } from "@/lib/sesion";
import { opcionesAnimal } from "@/lib/servicios/animales";
import { CAMPOS_ANIMAL } from "@/lib/validaciones/animales";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioAnimal } from "../../formulario-animal";

export const metadata: Metadata = { title: "Editar animal" };

export default async function EditarAnimal({ params }: PageProps<"/animales/[id]/editar">) {
  await requierePermiso("animal:editar");
  const { id } = await params;
  const animal = await prismaBase.animal.findFirst({ where: { id, deletedAt: null } });
  if (!animal) notFound();
  const opciones = await opcionesAnimal();
  // La madre actual siempre debe aparecer aunque esté fuera de la lista.
  opciones.madres = opciones.madres.filter((m) => m.valor !== animal.id);
  return (
    <>
      <EncabezadoPagina
        titulo={`Editar ${animal.numero}${animal.nombre ? ` · ${animal.nombre}` : ""}`}
        volver={{ href: `/animales/${id}`, texto: "Hoja de vida" }}
      />
      <FormularioAnimal
        id={id}
        valores={valoresDesdeRegistro(CAMPOS_ANIMAL, animal)}
        opcionesDinamicas={opciones}
        hoyISO={hoyISO()}
      />
    </>
  );
}
