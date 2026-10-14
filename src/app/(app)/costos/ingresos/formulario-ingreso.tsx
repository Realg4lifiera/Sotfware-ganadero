"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { formatoCOP, parsearNumeroCO } from "@/lib/formato";
import { CAMPOS_INGRESO, esquemaIngreso, totalIngreso } from "@/lib/validaciones/ingresos";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { crearIngreso, editarIngreso } from "./acciones";

export function FormularioIngreso({
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
      secciones={[{ titulo: "Ingreso", campos: CAMPOS_INGRESO }]}
      esquema={esquemaIngreso}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={(v) => (id ? editarIngreso(id, v) : crearIngreso(v))}
      destino={() => "/costos/ingresos"}
      textoBoton={id ? "Guardar cambios" : "Registrar ingreso"}
      mensajeExito={id ? "Cambios guardados." : "Ingreso registrado."}
      alCambiar={(campo, v, fijar) => {
        // Concepto sugerido al elegir el tipo.
        if (campo === "tipo" && !v.concepto)
          fijar("concepto", v.tipo === "VENTA_LECHE" ? "Venta de leche" : "");
      }}
      resumen={(v) => (
        <div>
          <p className="text-muted-foreground text-xs">Valor total</p>
          <p className="font-display text-xl font-semibold tabular-nums">
            {formatoCOP(
              totalIngreso(
                parsearNumeroCO(String(v.cantidad ?? "")) ?? 0,
                parsearNumeroCO(String(v.precioUnitario ?? "")) ?? 0,
              ),
            )}
          </p>
        </div>
      )}
    />
  );
}
