"use client";

import { useState } from "react";
import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { CAMPOS_SUMINISTRO, esquemaSuministro } from "@/lib/validaciones/alimentacion";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { registrarSuministro } from "../acciones";

export function FormularioSuministro({
  valores,
  opcionesDinamicas,
  comprasPorInsumo,
}: {
  valores: ValoresFormulario;
  opcionesDinamicas: Record<string, Opcion[]>;
  comprasPorInsumo: Record<string, string[]>;
}) {
  const [insumoId, setInsumoId] = useState(String(valores.insumoId ?? ""));
  const delInsumo = new Set(comprasPorInsumo[insumoId] ?? []);
  return (
    <FormularioSecciones
      secciones={[{ titulo: "Suministro de alimento", campos: CAMPOS_SUMINISTRO }]}
      esquema={esquemaSuministro}
      valores={valores}
      opcionesDinamicas={{
        ...opcionesDinamicas,
        // Solo las compras del insumo elegido.
        compras: opcionesDinamicas.compras.filter((c) => delInsumo.has(c.valor)),
      }}
      enviar={registrarSuministro}
      destino={() => "/produccion/alimentacion"}
      textoBoton="Registrar suministro"
      mensajeExito="Suministro registrado."
      ocultar={(campo) => campo === "gastoId" && delInsumo.size === 0}
      alCambiar={(campo, v, fijar) => {
        if (campo !== "insumoId") return;
        setInsumoId(String(v.insumoId));
        fijar("gastoId", "");
      }}
    />
  );
}
