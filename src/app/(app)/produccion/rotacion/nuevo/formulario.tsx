"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { CAMPOS_ROTACION, esquemaRotacion } from "@/lib/validaciones/rotacion";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { rotarLote } from "../acciones";

export function FormularioRotacion({
  valores,
  opcionesDinamicas,
}: {
  valores: ValoresFormulario;
  opcionesDinamicas: Record<string, Opcion[]>;
}) {
  return (
    <FormularioSecciones
      secciones={[
        {
          titulo: "Rotación",
          descripcion: "El lote sale de su potrero actual y todos sus animales pasan al nuevo.",
          campos: CAMPOS_ROTACION,
        },
      ]}
      esquema={esquemaRotacion}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={rotarLote}
      destino={() => "/produccion/rotacion"}
      textoBoton="Registrar rotación"
      mensajeExito="Rotación registrada."
    />
  );
}
