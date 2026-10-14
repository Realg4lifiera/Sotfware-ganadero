import type { Metadata } from "next";
import { CAMPOS_ANIMAL, CAMPOS_ANIMAL_CREACION } from "@/lib/validaciones/animales";
import { valoresVacios } from "@/lib/formularios/campos";
import { hoyISO } from "@/lib/fechas";
import { requierePermiso } from "@/lib/sesion";
import { opcionesAnimal } from "@/lib/servicios/animales";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioAnimal } from "../formulario-animal";

export const metadata: Metadata = { title: "Nuevo animal" };

export default async function NuevoAnimal() {
  await requierePermiso("animal:crear");
  const opciones = await opcionesAnimal();
  const valores = {
    ...valoresVacios([...CAMPOS_ANIMAL, ...CAMPOS_ANIMAL_CREACION]),
    fechaIngreso: hoyISO(),
  };
  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo animal"
        descripcion="Registra un animal nacido en la finca o comprado."
        volver={{ href: "/animales", texto: "Animales" }}
      />
      <FormularioAnimal valores={valores} opcionesDinamicas={opciones} hoyISO={hoyISO()} />
    </>
  );
}
