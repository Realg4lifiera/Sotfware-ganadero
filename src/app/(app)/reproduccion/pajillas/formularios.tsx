"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import {
  CAMPO_EXISTENCIAS_INICIALES,
  CAMPOS_MOVIMIENTO_PAJILLA,
  CAMPOS_PAJILLA,
  esquemaMovimientoPajilla,
  esquemaPajilla,
  esquemaPajillaNueva,
} from "@/lib/validaciones/pajillas";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { crearPajilla, editarPajilla, moverPajilla } from "./acciones";

export function FormularioPajilla({
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
      secciones={[
        {
          titulo: "Pajilla",
          campos: id ? CAMPOS_PAJILLA : [...CAMPOS_PAJILLA, CAMPO_EXISTENCIAS_INICIALES],
        },
      ]}
      esquema={id ? esquemaPajilla : esquemaPajillaNueva}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={(v) => (id ? editarPajilla(id, v) : crearPajilla(v))}
      destino={(nuevo) => `/reproduccion/pajillas/${id ?? nuevo}`}
      textoBoton={id ? "Guardar cambios" : "Registrar pajilla"}
      mensajeExito={id ? "Cambios guardados." : "Pajilla registrada."}
    />
  );
}

export function FormularioMovimientoPajilla({
  id,
  valores,
}: {
  id: string;
  valores: ValoresFormulario;
}) {
  return (
    <FormularioSecciones
      secciones={[
        {
          titulo: "Registrar movimiento",
          descripcion: "Los usos se descuentan solos al registrar una inseminación.",
          campos: CAMPOS_MOVIMIENTO_PAJILLA,
        },
      ]}
      esquema={esquemaMovimientoPajilla}
      valores={valores}
      enviar={(v) => moverPajilla(id, v)}
      destino={() => `/reproduccion/pajillas/${id}`}
      textoBoton="Registrar movimiento"
      mensajeExito="Movimiento registrado."
    />
  );
}
