"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { Opcion } from "@/lib/formularios/campos";
import { esquemaRegla, type ValoresRegla } from "@/lib/validaciones/costos-indirectos";
import { parsearNumeroCO } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Campo } from "@/components/formularios/campo";
import { EstadoVacio } from "@/components/estado-vacio";
import { eliminarRegla, guardarRegla } from "../acciones";

interface Regla {
  id: string;
  nombre: string;
  descripcion: string;
  detalles: { centroCostoId: string; centro: string; porcentaje: number }[];
}

export function VistaReglas({
  reglas,
  centros,
  editable,
}: {
  reglas: Regla[];
  centros: Opcion[];
  editable: boolean;
}) {
  const [editando, setEditando] = useState<Regla | "nueva" | null>(null);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <>
      {editable && (
        <Button className="mb-4" onClick={() => setEditando("nueva")}>
          <Plus /> Nueva regla
        </Button>
      )}
      {reglas.length === 0 ? (
        <EstadoVacio
          titulo="No hay reglas de prorrateo"
          descripcion="Crea una para repartir los gastos entre centros."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reglas.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>{r.nombre}</CardTitle>
                  {r.descripcion && <CardDescription>{r.descripcion}</CardDescription>}
                </div>
                {editable && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Editar"
                      onClick={() => setEditando(r)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Eliminar"
                      className="text-destructive"
                      disabled={pendiente}
                      onClick={() =>
                        iniciar(async () => {
                          const res = await eliminarRegla(r.id);
                          if (res.ok) {
                            toast.success("Regla eliminada.");
                            router.refresh();
                          } else toast.error(res.error);
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {r.detalles.map((d) => (
                  <div key={d.centroCostoId} className="flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 truncate">{d.centro}</span>
                    <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <span
                        className="bg-primary block h-full"
                        style={{ width: `${d.porcentaje}%` }}
                      />
                    </span>
                    <span className="w-14 text-right font-semibold tabular-nums">
                      {d.porcentaje.toLocaleString("es-CO")} %
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={editando !== null} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-xl">
          {editando !== null && (
            <FormularioRegla
              key={editando === "nueva" ? "nueva" : editando.id}
              regla={editando === "nueva" ? null : editando}
              centros={centros}
              alTerminar={() => {
                setEditando(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormularioRegla({
  regla,
  centros,
  alTerminar,
}: {
  regla: Regla | null;
  centros: Opcion[];
  alTerminar: () => void;
}) {
  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ValoresRegla>({
    resolver: zodResolver(esquemaRegla) as never,
    defaultValues: {
      nombre: regla?.nombre ?? "",
      descripcion: regla?.descripcion ?? "",
      detalles: regla?.detalles.map((d) => ({
        centroCostoId: d.centroCostoId,
        porcentaje: String(d.porcentaje),
      })) ?? [{ centroCostoId: "", porcentaje: "100" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "detalles" });
  const detalles = useWatch({ control, name: "detalles" });
  const suma = (detalles ?? []).reduce(
    (s, d) => s + (parsearNumeroCO(String(d?.porcentaje ?? "")) ?? 0),
    0,
  );

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async () => {
        const r = await guardarRegla(regla?.id ?? null, getValues());
        if (r.ok) {
          toast.success("Regla guardada.");
          alTerminar();
        } else toast.error(r.error);
      })}
    >
      <DialogHeader className="mb-4">
        <DialogTitle>{regla ? "Editar regla" : "Nueva regla de prorrateo"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <Campo id="nombre" etiqueta="Nombre" requerido error={errors.nombre?.message}>
          <Input id="nombre" {...register("nombre")} />
        </Campo>
        <Campo id="descripcion" etiqueta="Descripción" error={errors.descripcion?.message}>
          <Input id="descripcion" {...register("descripcion")} />
        </Campo>
        <div className="flex flex-col gap-2">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2">
              <div className="flex-1">
                <NativeSelect
                  aria-label="Centro de costo"
                  {...register(`detalles.${i}.centroCostoId`)}
                >
                  <option value="">Centro de costo…</option>
                  {centros.map((c) => (
                    <option key={c.valor} value={c.valor}>
                      {c.etiqueta}
                    </option>
                  ))}
                </NativeSelect>
                {errors.detalles?.[i]?.centroCostoId && (
                  <p className="text-destructive mt-1 text-xs">
                    {errors.detalles[i]?.centroCostoId?.message}
                  </p>
                )}
              </div>
              <div className="relative w-28">
                <Input
                  aria-label="Porcentaje"
                  inputMode="decimal"
                  className="pr-8"
                  {...register(`detalles.${i}.porcentaje`)}
                />
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                  %
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar"
                onClick={() => remove(i)}
                disabled={fields.length === 1}
              >
                <X />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ centroCostoId: "", porcentaje: "" })}
            >
              <Plus /> Agregar centro
            </Button>
            <span
              className={`text-sm font-semibold ${Math.abs(suma - 100) > 0.001 ? "text-destructive" : "text-success"}`}
            >
              Suma: {suma.toLocaleString("es-CO")} %
            </span>
          </div>
        </div>
      </div>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={alTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
