"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { formatoCOP } from "@/lib/formato";
import {
  CAMPOS_PAGO_DEVENGADO,
  CAMPOS_PAGO_GENERAL,
  CAMPOS_PAGO_PRESTACIONES,
  CAMPOS_PAGO_SEGURIDAD,
  esquemaPago,
  totalesPagoDesdeFormulario,
} from "@/lib/validaciones/nomina";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { crearPago, editarPago } from "./acciones";

export function FormularioPago({
  id,
  valores,
  opcionesDinamicas,
  salariosBase,
}: {
  id?: string;
  valores: ValoresFormulario;
  opcionesDinamicas: Record<string, Opcion[]>;
  salariosBase: Record<string, string>;
}) {
  return (
    <FormularioSecciones
      secciones={[
        { titulo: "Pago", campos: CAMPOS_PAGO_GENERAL },
        { titulo: "Devengado", campos: CAMPOS_PAGO_DEVENGADO },
        { titulo: "Seguridad social", campos: CAMPOS_PAGO_SEGURIDAD },
        {
          titulo: "Prestaciones",
          descripcion: "Para contratos sin prestaciones déjalas en cero.",
          campos: CAMPOS_PAGO_PRESTACIONES,
        },
      ]}
      esquema={esquemaPago}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={(v) => (id ? editarPago(id, v) : crearPago(v))}
      destino={() => "/costos/nomina"}
      textoBoton={id ? "Guardar cambios" : "Registrar pago"}
      mensajeExito={id ? "Cambios guardados." : "Pago registrado."}
      alCambiar={(campo, v, fijar) => {
        // Al elegir el trabajador se propone su salario base (si aún no hay salario).
        const salario = salariosBase[String(v.trabajadorId)];
        if (campo === "trabajadorId" && salario && (!v.salario || v.salario === "0"))
          fijar("salario", salario);
      }}
      resumen={(v) => {
        const t = totalesPagoDesdeFormulario(v);
        return (
          <dl className="grid grid-cols-3 gap-3 text-sm sm:flex sm:gap-6">
            <div>
              <dt className="text-muted-foreground text-xs">Seguridad social</dt>
              <dd className="tabular-nums">{formatoCOP(t.seguridadSocial)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Prestaciones</dt>
              <dd className="tabular-nums">{formatoCOP(t.prestaciones)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Costo total</dt>
              <dd className="font-display text-xl font-semibold tabular-nums">
                {formatoCOP(t.costoTotal)}
              </dd>
            </div>
          </dl>
        );
      }}
    />
  );
}
