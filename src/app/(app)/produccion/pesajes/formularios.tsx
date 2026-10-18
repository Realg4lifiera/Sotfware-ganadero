"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { formatoFecha, fechaDesdeISO } from "@/lib/fechas";
import { formatoKg, parsearNumeroCO } from "@/lib/formato";
import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { cn } from "@/lib/utils";
import { CAMPOS_PESAJE, esquemaPesaje } from "@/lib/validaciones/pesajes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { registrarPesaje, registrarPesajeLote } from "./acciones";

export function FormularioPesaje({
  valores,
  opcionesDinamicas,
}: {
  valores: ValoresFormulario;
  opcionesDinamicas: Record<string, Opcion[]>;
}) {
  return (
    <FormularioSecciones
      secciones={[{ titulo: "Pesaje", campos: CAMPOS_PESAJE }]}
      esquema={esquemaPesaje}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={registrarPesaje}
      destino={() => "/produccion/pesajes"}
      textoBoton="Registrar pesaje"
      mensajeExito="Pesaje registrado."
    />
  );
}

export interface AnimalPlanilla {
  animalId: string;
  numero: string;
  nombre: string | null;
  ultimo: { fecha: string; pesoKg: number } | null;
}

/** Planilla para pesar un lote completo el mismo día. */
export function PlanillaPesaje({
  fecha,
  metodo,
  animales,
}: {
  fecha: string;
  metodo: "BASCULA" | "CINTA";
  animales: AnimalPlanilla[];
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [pesos, setPesos] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const escritos = animales.filter((a) => (pesos[a.animalId] ?? "").trim() !== "").length;

  const guardar = () =>
    iniciar(async () => {
      const r = await registrarPesajeLote({
        fecha,
        metodo,
        filas: animales.map((a) => ({ animalId: a.animalId, pesoKg: pesos[a.animalId] ?? "" })),
      });
      if (!r.ok) {
        setErrores(r.erroresCampo ?? {});
        toast.error(r.error);
        return;
      }
      toast.success(`${r.datos} pesajes registrados.`);
      router.push("/produccion/pesajes");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <ul className="bg-card divide-y overflow-hidden rounded-xl border">
        {animales.map((a) => {
          const nuevo = parsearNumeroCO(pesos[a.animalId] ?? "");
          const diferencia = nuevo && a.ultimo ? nuevo - a.ultimo.pesoKg : null;
          return (
            <li
              key={a.animalId}
              className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-3 px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {a.numero}
                  {a.nombre ? ` · ${a.nombre}` : ""}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {a.ultimo
                    ? `Último: ${formatoKg(a.ultimo.pesoKg)} el ${formatoFecha(fechaDesdeISO(a.ultimo.fecha))}`
                    : "Sin pesajes"}
                  {diferencia != null &&
                    ` · ${diferencia >= 0 ? "+" : ""}${formatoKg(Math.round(diferencia * 10) / 10)}`}
                </span>
              </span>
              <Input
                inputMode="decimal"
                aria-label={`Peso ${a.numero}`}
                placeholder="kg"
                title={errores[a.animalId]}
                className={cn(
                  "text-right tabular-nums",
                  errores[a.animalId] && "border-destructive",
                )}
                value={pesos[a.animalId] ?? ""}
                onChange={(e) => setPesos((x) => ({ ...x, [a.animalId]: e.target.value }))}
              />
            </li>
          );
        })}
      </ul>
      <div className="bg-card/95 sticky bottom-20 z-10 flex items-center justify-between gap-3 rounded-xl border p-4 shadow-md backdrop-blur lg:bottom-4">
        <p className="text-sm">
          {escritos} de {animales.length} animales
        </p>
        <Button size="lg" onClick={guardar} disabled={pendiente || escritos === 0}>
          <Save /> {pendiente ? "Guardando…" : "Guardar pesajes"}
        </Button>
      </div>
    </div>
  );
}
