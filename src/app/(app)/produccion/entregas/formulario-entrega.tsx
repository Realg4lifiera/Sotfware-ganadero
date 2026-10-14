"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { CAMPOS_ENTREGA, esquemaEntrega } from "@/lib/validaciones/leche";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { crearEntrega, editarEntrega } from "./acciones";

export function FormularioEntrega({
  id,
  valores,
  opcionesDinamicas,
}: {
  id?: string;
  valores: ValoresFormulario;
  opcionesDinamicas: Record<string, Opcion[]>;
}) {
  return (
    <FormularioSecciones
      secciones={[{ titulo: "Entrega de leche", campos: CAMPOS_ENTREGA }]}
      esquema={esquemaEntrega}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={(v) => (id ? editarEntrega(id, v) : crearEntrega(v))}
      destino={() => "/produccion/entregas"}
      textoBoton={id ? "Guardar cambios" : "Registrar entrega"}
      mensajeExito={id ? "Cambios guardados." : "Entrega registrada."}
    />
  );
}
