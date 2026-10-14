"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CopyPlus, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import type { RubroComparativo } from "@/lib/dominio/presupuesto";
import { porcentajeEjecucion } from "@/lib/dominio/presupuesto";
import { ETIQUETA_GRUPO_COSTO } from "@/lib/etiquetas";
import { formatoCOP, formatoNumero, formatoPorcentaje } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { copiarMesAnterior, guardarPresupuesto } from "./acciones";
import type { GrupoCosto } from "@/generated/prisma/enums";

function Ejecucion({ presupuestado, ejecutado }: { presupuestado: number; ejecutado: number }) {
  const pct = porcentajeEjecucion(presupuestado, ejecutado);
  if (pct === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn(pct > 1 ? "text-destructive font-semibold" : "text-foreground")}>
      {formatoPorcentaje(pct)}
    </span>
  );
}

const COLUMNAS =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_9rem_5rem]";

export function VistaPresupuesto({
  mes,
  rubros,
  editable,
}: {
  mes: string;
  rubros: RubroComparativo[];
  editable: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const inicial = () =>
    Object.fromEntries(
      rubros.flatMap((r) =>
        r.filas
          .filter((f) => f.categoriaId)
          .map((f) => [f.categoriaId!, f.presupuestado ? formatoNumero(f.presupuestado) : ""]),
      ),
    );
  const [valores, setValores] = useState<Record<string, string>>(inicial);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const guardar = () =>
    iniciar(async () => {
      const r = await guardarPresupuesto({ mes, valores });
      if (!r.ok) {
        setErrores(r.erroresCampo ?? {});
        toast.error(r.error);
        return;
      }
      toast.success("Presupuesto guardado.");
      setErrores({});
      setEditando(false);
      router.refresh();
    });

  const copiar = () =>
    iniciar(async () => {
      const r = await copiarMesAnterior(mes);
      if (!r.ok) return void toast.error(r.error);
      toast.success(`Se copiaron ${r.datos} categorías del mes anterior.`);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      {editable && (
        <div className="flex flex-wrap gap-2">
          {editando ? (
            <>
              <Button onClick={guardar} disabled={pendiente}>
                <Save /> {pendiente ? "Guardando…" : "Guardar presupuesto"}
              </Button>
              <Button
                variant="outline"
                disabled={pendiente}
                onClick={() => {
                  setValores(inicial());
                  setErrores({});
                  setEditando(false);
                }}
              >
                <X /> Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditando(true)}>
                <Pencil /> Editar presupuesto
              </Button>
              <Button variant="outline" onClick={copiar} disabled={pendiente}>
                <CopyPlus /> Copiar del mes anterior
              </Button>
            </>
          )}
        </div>
      )}
      {rubros.map((r, i) => {
        const encabezadoGrupo = r.grupo !== rubros[i - 1]?.grupo;
        return (
          <div key={r.rubroId} className="flex flex-col gap-2">
            {encabezadoGrupo && (
              <h2 className="font-display mt-2 text-lg font-semibold">
                {ETIQUETA_GRUPO_COSTO[r.grupo as GrupoCosto]}
              </h2>
            )}
            <Card className="gap-2 py-3">
              <CardHeader className="px-4">
                <CardTitle className={cn(COLUMNAS, "items-baseline text-base")}>
                  <span className="truncate">{r.nombre}</span>
                  <span className="text-right tabular-nums">
                    {formatoCOP(r.ejecutado)}
                    <span className="text-muted-foreground block text-xs font-normal sm:hidden">
                      de {formatoCOP(r.presupuestado)}
                    </span>
                  </span>
                  <span className="hidden text-right tabular-nums sm:block">
                    {formatoCOP(r.presupuestado)}
                  </span>
                  <span className="hidden text-right tabular-nums sm:block">
                    {formatoCOP(r.presupuestado - r.ejecutado)}
                  </span>
                  <span className="text-right text-sm tabular-nums">
                    <Ejecucion presupuestado={r.presupuestado} ejecutado={r.ejecutado} />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div
                  className={cn(
                    COLUMNAS,
                    "text-muted-foreground border-b pb-1 text-xs font-semibold",
                  )}
                >
                  <span>Categoría</span>
                  <span className="text-right">Ejecutado</span>
                  <span className="hidden text-right sm:block">Presupuestado</span>
                  <span className="hidden text-right sm:block">Diferencia</span>
                  <span className="text-right">Ejec.</span>
                </div>
                {r.filas.map((f) => (
                  <div
                    key={f.clave}
                    className={cn(COLUMNAS, "items-center border-b py-2 text-sm last:border-0")}
                  >
                    <div className="min-w-0">
                      <span className={cn("block truncate", !f.categoriaId && "italic")}>
                        {f.nombre}
                      </span>
                      {editando && f.categoriaId ? (
                        <div className="mt-1 sm:hidden">
                          <Input
                            inputMode="decimal"
                            aria-label={`Presupuesto ${f.nombre}`}
                            value={valores[f.categoriaId] ?? ""}
                            onChange={(e) =>
                              setValores((v) => ({ ...v, [f.categoriaId!]: e.target.value }))
                            }
                            aria-invalid={!!errores[f.categoriaId]}
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground block text-xs sm:hidden">
                          Presupuesto: {f.categoriaId ? formatoCOP(f.presupuestado) : "en el rubro"}
                        </span>
                      )}
                    </div>
                    <span className="text-right tabular-nums">{formatoCOP(f.ejecutado)}</span>
                    <span className="hidden text-right tabular-nums sm:block">
                      {editando && f.categoriaId ? (
                        <Input
                          inputMode="decimal"
                          className="text-right"
                          aria-label={`Presupuesto ${f.nombre}`}
                          value={valores[f.categoriaId] ?? ""}
                          onChange={(e) =>
                            setValores((v) => ({ ...v, [f.categoriaId!]: e.target.value }))
                          }
                          aria-invalid={!!errores[f.categoriaId]}
                          placeholder="0"
                        />
                      ) : f.categoriaId ? (
                        formatoCOP(f.presupuestado)
                      ) : (
                        "—"
                      )}
                    </span>
                    <span className="hidden text-right tabular-nums sm:block">
                      {f.categoriaId ? formatoCOP(f.presupuestado - f.ejecutado) : "—"}
                    </span>
                    <span className="text-right tabular-nums">
                      <Ejecucion presupuestado={f.presupuestado} ejecutado={f.ejecutado} />
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
