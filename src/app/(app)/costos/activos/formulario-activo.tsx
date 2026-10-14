"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { formatoCOP, parsearNumeroCO } from "@/lib/formato";
import { CAMPOS_ACTIVO, esquemaActivo } from "@/lib/validaciones/activos";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { crearActivo, editarActivo } from "./acciones";

export function FormularioActivo({
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
      secciones={[{ titulo: "Activo", campos: CAMPOS_ACTIVO }]}
      esquema={esquemaActivo}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={(v) => (id ? editarActivo(id, v) : crearActivo(v))}
      destino={() => "/costos/activos"}
      textoBoton={id ? "Guardar cambios" : "Registrar activo"}
      mensajeExito={id ? "Cambios guardados." : "Activo registrado."}
      resumen={(v) => {
        const compra = parsearNumeroCO(String(v.valorCompra ?? "")) ?? 0;
        const residual = parsearNumeroCO(String(v.valorResidual ?? "")) ?? 0;
        const meses = parsearNumeroCO(String(v.vidaUtilMeses ?? "")) ?? 0;
        return (
          <div>
            <p className="text-muted-foreground text-xs">Depreciación mensual</p>
            <p className="font-display text-xl font-semibold tabular-nums">
              {meses > 0 ? formatoCOP(Math.max(0, compra - residual) / meses) : "—"}
            </p>
          </div>
        );
      }}
    />
  );
}
