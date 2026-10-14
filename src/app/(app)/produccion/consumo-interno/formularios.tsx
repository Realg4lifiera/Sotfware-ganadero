"use client";

import type { ValoresFormulario } from "@/lib/formularios/campos";
import { formatoLitros, parsearNumeroCO } from "@/lib/formato";
import {
  CAMPOS_CONSUMO,
  CAMPOS_CONSUMO_LOTE,
  esquemaConsumo,
  esquemaConsumoLote,
} from "@/lib/validaciones/leche";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { crearConsumos, editarConsumo } from "./acciones";

export function FormularioConsumos({ valores }: { valores: ValoresFormulario }) {
  return (
    <FormularioSecciones
      secciones={[
        {
          titulo: "Consumo de leche",
          descripcion: "Deja en cero los destinos que no apliquen.",
          campos: CAMPOS_CONSUMO_LOTE,
        },
      ]}
      esquema={esquemaConsumoLote}
      valores={valores}
      enviar={crearConsumos}
      destino={() => "/produccion/consumo-interno"}
      textoBoton="Registrar consumo"
      mensajeExito="Consumo registrado."
      resumen={(v) => (
        <div>
          <p className="text-muted-foreground text-xs">Total</p>
          <p className="font-display text-xl font-semibold tabular-nums">
            {formatoLitros(
              ["TRABAJADORES", "TERNERAS", "RETIRO", "ARRIENDO"].reduce(
                (s, k) => s + (parsearNumeroCO(String(v[k] ?? "")) ?? 0),
                0,
              ),
            )}
          </p>
        </div>
      )}
    />
  );
}

export function FormularioConsumo({ id, valores }: { id: string; valores: ValoresFormulario }) {
  return (
    <FormularioSecciones
      secciones={[{ titulo: "Consumo de leche", campos: CAMPOS_CONSUMO }]}
      esquema={esquemaConsumo}
      valores={valores}
      enviar={(v) => editarConsumo(id, v)}
      destino={() => "/produccion/consumo-interno"}
      textoBoton="Guardar cambios"
      mensajeExito="Cambios guardados."
    />
  );
}
