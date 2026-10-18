"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { formatoLitros, parsearNumeroCO } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { guardarControl } from "../acciones";

export interface VacaPlanilla {
  animalId: string;
  numero: string;
  nombre: string | null;
  loteId: string | null;
  lote: string;
  diasEnLeche: number;
}

type Jornadas = "UNO" | "DOS";

/**
 * Planilla de control lechero: litros de cada vaca en lactancia el día del control.
 * Con dos ordeños se registran mañana y tarde; con uno, el día completo.
 */
export function Planilla({
  fecha,
  vacas,
  valores: iniciales,
}: {
  fecha: string;
  vacas: VacaPlanilla[];
  /** "animalId_JORNADA" → litros ya registrados. */
  valores: Record<string, string>;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [valores, setValores] = useState(iniciales);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [modo, setModo] = useState<Jornadas>(
    Object.keys(iniciales).some((k) => k.endsWith("_DIA")) ? "UNO" : "DOS",
  );
  const lotes = useMemo(
    () => [...new Map(vacas.map((v) => [v.loteId ?? "", v.lote])).entries()],
    [vacas],
  );
  const [lote, setLote] = useState(lotes.length > 1 ? lotes[0][0] : "*");
  const visibles = vacas.filter((v) => lote === "*" || (v.loteId ?? "") === lote);
  const jornadas = modo === "DOS" ? (["MANANA", "TARDE"] as const) : (["DIA"] as const);

  const total = (id: string) =>
    jornadas.reduce((s, j) => s + (parsearNumeroCO(valores[`${id}_${j}`] ?? "") ?? 0), 0);
  const totalVisible = visibles.reduce((s, v) => s + total(v.animalId), 0);
  const registradas = visibles.filter((v) => total(v.animalId) > 0).length;

  const guardar = () =>
    iniciar(async () => {
      // Se envían las jornadas del modo actual de las vacas visibles (vacías = borrar).
      const filas = visibles.flatMap((v) =>
        jornadas.map((j) => ({
          animalId: v.animalId,
          jornada: j,
          litros: valores[`${v.animalId}_${j}`] ?? "",
        })),
      );
      const r = await guardarControl({ fecha, filas });
      if (!r.ok) {
        setErrores(r.erroresCampo ?? {});
        toast.error(r.error);
        return;
      }
      setErrores({});
      toast.success(`Control guardado (${r.datos} registros).`);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {lotes.length > 1 && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground text-xs font-semibold">Lote</span>
            <NativeSelect value={lote} onChange={(e) => setLote(e.target.value)}>
              {lotes.map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
              <option value="*">Todos</option>
            </NativeSelect>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground text-xs font-semibold">Ordeños al día</span>
          <NativeSelect value={modo} onChange={(e) => setModo(e.target.value as Jornadas)}>
            <option value="DOS">Dos (mañana y tarde)</option>
            <option value="UNO">Uno (día completo)</option>
          </NativeSelect>
        </label>
      </div>

      <ul className="bg-card divide-y overflow-hidden rounded-xl border">
        <li
          className="text-muted-foreground grid grid-cols-[minmax(0,1fr)_repeat(var(--n),5.5rem)] gap-2 px-3 py-2 text-xs font-semibold [--n:2] data-[uno=true]:[--n:1]"
          data-uno={modo === "UNO"}
        >
          <span>Vaca</span>
          {jornadas.map((j) => (
            <span key={j} className="text-right">
              {j === "MANANA" ? "Mañana" : j === "TARDE" ? "Tarde" : "Litros"}
            </span>
          ))}
        </li>
        {visibles.map((v) => (
          <li
            key={v.animalId}
            data-uno={modo === "UNO"}
            className="grid grid-cols-[minmax(0,1fr)_repeat(var(--n),5.5rem)] items-center gap-2 px-3 py-2 [--n:2] data-[uno=true]:[--n:1]"
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold">
                {v.numero}
                {v.nombre ? ` · ${v.nombre}` : ""}
              </span>
              <span className="text-muted-foreground block text-xs">
                {v.diasEnLeche} días en leche
                {total(v.animalId) > 0 && modo === "DOS"
                  ? ` · ${formatoLitros(total(v.animalId))}`
                  : ""}
              </span>
            </span>
            {jornadas.map((j) => {
              const k = `${v.animalId}_${j}`;
              return (
                <Input
                  key={j}
                  inputMode="decimal"
                  aria-label={`${v.numero} ${j === "MANANA" ? "mañana" : j === "TARDE" ? "tarde" : "litros"}`}
                  className={cn("text-right tabular-nums", errores[k] && "border-destructive")}
                  title={errores[k]}
                  value={valores[k] ?? ""}
                  onChange={(e) => setValores((x) => ({ ...x, [k]: e.target.value }))}
                  placeholder="—"
                />
              );
            })}
          </li>
        ))}
      </ul>

      <div className="bg-card/95 sticky bottom-20 z-10 flex items-center justify-between gap-3 rounded-xl border p-4 shadow-md backdrop-blur lg:bottom-4">
        <div>
          <p className="text-muted-foreground text-xs">
            {registradas} de {visibles.length} vacas
          </p>
          <p className="font-display text-xl font-semibold tabular-nums">
            {formatoLitros(Math.round(totalVisible * 100) / 100)}
          </p>
        </div>
        <Button size="lg" onClick={guardar} disabled={pendiente || visibles.length === 0}>
          <Save /> {pendiente ? "Guardando…" : "Guardar control"}
        </Button>
      </div>
    </div>
  );
}
