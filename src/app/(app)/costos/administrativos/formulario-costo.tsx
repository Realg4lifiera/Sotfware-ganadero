"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { MESES_PERIODICIDAD } from "@/lib/dominio/prorrateo";
import { formatoCOP, parsearNumeroCO } from "@/lib/formato";
import {
  CAMPOS_COSTO_INDIRECTO,
  CAMPOS_COSTO_INDIRECTO_ASIGNACION,
  esquemaCostoIndirecto,
} from "@/lib/validaciones/costos-indirectos";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { crearCosto, editarCosto } from "./acciones";

export function FormularioCosto({
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
        { titulo: "Gasto administrativo", campos: CAMPOS_COSTO_INDIRECTO },
        {
          titulo: "Asignación",
          descripcion: "A un centro de costo, o repartido entre varios con una regla de prorrateo.",
          campos: CAMPOS_COSTO_INDIRECTO_ASIGNACION,
        },
      ]}
      esquema={esquemaCostoIndirecto}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={(v) => (id ? editarCosto(id, v) : crearCosto(v))}
      destino={() => "/costos/administrativos"}
      textoBoton={id ? "Guardar cambios" : "Registrar gasto"}
      mensajeExito={id ? "Cambios guardados." : "Gasto administrativo registrado."}
      resumen={(v) => {
        const meses = MESES_PERIODICIDAD[v.periodicidad as keyof typeof MESES_PERIODICIDAD] ?? 1;
        const total = parsearNumeroCO(String(v.valorTotal ?? "")) ?? 0;
        const litros = parsearNumeroCO(String(v.litros ?? "")) ?? 0;
        return (
          <dl className="grid grid-cols-3 gap-3 text-sm sm:flex sm:gap-6">
            <div>
              <dt className="text-muted-foreground text-xs">Total / período</dt>
              <dd className="tabular-nums">{formatoCOP(total)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Por mes ({meses})</dt>
              <dd className="font-display text-xl font-semibold tabular-nums">
                {formatoCOP(total / meses)}
              </dd>
            </div>
            {litros > 0 && (
              <div>
                <dt className="text-muted-foreground text-xs">Por litro</dt>
                <dd className="tabular-nums">{formatoCOP(total / litros)}</dd>
              </div>
            )}
          </dl>
        );
      }}
    />
  );
}
