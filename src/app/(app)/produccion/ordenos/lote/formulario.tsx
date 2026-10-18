"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { CAMPOS_ORDENO_LOTE, esquemaOrdenoLote } from "@/lib/validaciones/ordenos";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { registrarOrdenoLote } from "../acciones";

export function FormularioOrdenoLote({
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
          titulo: "Total del lote",
          descripcion: "Para los días en que no se pesa la leche vaca por vaca.",
          campos: CAMPOS_ORDENO_LOTE,
        },
      ]}
      esquema={esquemaOrdenoLote}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={registrarOrdenoLote}
      destino={() => "/produccion/ordenos"}
      textoBoton="Registrar ordeño"
      mensajeExito="Ordeño registrado."
    />
  );
}
