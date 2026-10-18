"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import {
  CAMPOS_SANITARIO,
  esquemaSanitario,
  ocultarCampoSanitario,
} from "@/lib/validaciones/sanidad";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { registrarEventoSanitario } from "../acciones";

const RETIROS = ["diasRetiroLeche", "diasRetiroCarne"];

export function FormularioSanitario({
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
          titulo: "Evento sanitario",
          campos: CAMPOS_SANITARIO.filter((c) => !RETIROS.includes(c.nombre)),
        },
        {
          titulo: "Retiros",
          descripcion:
            "La leche de una vaca en retiro no se vende: regístrala en Consumo interno › Retiro.",
          campos: CAMPOS_SANITARIO.filter((c) => RETIROS.includes(c.nombre)),
        },
      ]}
      esquema={esquemaSanitario}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={registrarEventoSanitario}
      destino={() => "/produccion/sanidad"}
      textoBoton="Registrar evento"
      mensajeExito="Evento sanitario registrado."
      ocultar={ocultarCampoSanitario}
      alCambiar={(campo, v, fijar) => {
        // Al elegir un producto del catálogo se propone su nombre.
        if (campo === "insumoId") {
          const p = opcionesDinamicas.insumos.find((i) => i.valor === v.insumoId);
          if (p && !String(v.producto ?? "").trim()) fijar("producto", p.etiqueta);
        }
      }}
    />
  );
}
