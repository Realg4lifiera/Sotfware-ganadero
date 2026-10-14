"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ETIQUETA_TIPO_MOVIMIENTO } from "@/lib/etiquetas";
import type { Opcion } from "@/lib/formularios/campos";
import {
  esquemaMovimiento,
  type TipoMovimientoRegistrable,
  type ValoresMovimiento,
} from "@/lib/validaciones/animales";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/components/formularios/campo";
import { eliminarAnimal, registrarMovimiento } from "../acciones";

export function BotonMovimiento({
  animalId,
  tipos,
  opciones,
  loteActualId,
  potreroActualId,
  hoyISO,
}: {
  animalId: string;
  tipos: TipoMovimientoRegistrable[];
  opciones: { lotes: Opcion[]; potreros: Opcion[]; compradores: Opcion[] };
  loteActualId: string | null;
  potreroActualId: string | null;
  hoyISO: string;
}) {
  const [abierto, setAbierto] = useState(false);
  if (tipos.length === 0) return null;
  return (
    <>
      <Button size="sm" onClick={() => setAbierto(true)}>
        <ArrowRightLeft /> Movimiento
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          {abierto && (
            <FormularioMovimiento
              animalId={animalId}
              tipos={tipos}
              opciones={opciones}
              loteActualId={loteActualId}
              potreroActualId={potreroActualId}
              hoyISO={hoyISO}
              alTerminar={() => setAbierto(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormularioMovimiento({
  animalId,
  tipos,
  opciones,
  loteActualId,
  potreroActualId,
  hoyISO,
  alTerminar,
}: {
  animalId: string;
  tipos: TipoMovimientoRegistrable[];
  opciones: { lotes: Opcion[]; potreros: Opcion[]; compradores: Opcion[] };
  loteActualId: string | null;
  potreroActualId: string | null;
  hoyISO: string;
  alTerminar: () => void;
}) {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ValoresMovimiento>({
    resolver: zodResolver(esquemaMovimiento) as never,
    defaultValues: { tipo: tipos[0], fecha: hoyISO, motivo: "", valor: "", pesoKg: "" },
    shouldUnregister: true,
  });
  const tipo = useWatch({ control, name: "tipo" });
  const salida = tipo === "VENTA" || tipo === "MUERTE" || tipo === "DESCARTE";

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async () => {
        const r = await registrarMovimiento(animalId, getValues());
        if (r.ok) {
          toast.success(`Movimiento registrado: ${ETIQUETA_TIPO_MOVIMIENTO[tipo].toLowerCase()}.`);
          alTerminar();
          return;
        }
        for (const [c, m] of Object.entries(r.erroresCampo ?? {}))
          setError(c as keyof ValoresMovimiento, { message: m });
        toast.error(r.error);
      })}
    >
      <DialogHeader className="mb-4">
        <DialogTitle>Registrar movimiento</DialogTitle>
        <DialogDescription>
          {salida
            ? "El animal saldrá del inventario activo. Queda en el historial y en la auditoría."
            : "Cambia la ubicación del animal; queda en su historial."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="tipo" etiqueta="Tipo" error={errors.tipo?.message}>
          <NativeSelect id="tipo" {...register("tipo")}>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_MOVIMIENTO[t]}
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <Campo id="fecha" etiqueta="Fecha" error={errors.fecha?.message}>
          <Input id="fecha" type="date" max={hoyISO} {...register("fecha")} />
        </Campo>
        {tipo === "TRASLADO_LOTE" && (
          <Campo
            id="loteDestinoId"
            etiqueta="Lote de destino"
            error={errors.loteDestinoId?.message}
            className="sm:col-span-2"
          >
            <NativeSelect id="loteDestinoId" {...register("loteDestinoId")}>
              <option value="">Selecciona…</option>
              {opciones.lotes.map((o) => (
                <option key={o.valor} value={o.valor} disabled={o.valor === loteActualId}>
                  {o.etiqueta}
                  {o.valor === loteActualId ? " (actual)" : ""}
                </option>
              ))}
            </NativeSelect>
          </Campo>
        )}
        {tipo === "TRASLADO_POTRERO" && (
          <Campo
            id="potreroDestinoId"
            etiqueta="Potrero de destino"
            error={errors.potreroDestinoId?.message}
            className="sm:col-span-2"
          >
            <NativeSelect id="potreroDestinoId" {...register("potreroDestinoId")}>
              <option value="">Selecciona…</option>
              {opciones.potreros.map((o) => (
                <option key={o.valor} value={o.valor} disabled={o.valor === potreroActualId}>
                  {o.etiqueta}
                  {o.valor === potreroActualId ? " (actual)" : ""}
                </option>
              ))}
            </NativeSelect>
          </Campo>
        )}
        {tipo === "VENTA" && (
          <>
            <Campo
              id="valor"
              etiqueta="Valor de la venta (COP)"
              requerido
              error={errors.valor?.message}
            >
              <Input
                id="valor"
                inputMode="decimal"
                placeholder="1.400.000"
                {...register("valor")}
              />
            </Campo>
            <Campo id="compradorId" etiqueta="Comprador" error={errors.compradorId?.message}>
              <NativeSelect id="compradorId" {...register("compradorId")}>
                <option value="">— Sin especificar —</option>
                {opciones.compradores.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </NativeSelect>
            </Campo>
          </>
        )}
        {salida && (
          <Campo id="pesoKg" etiqueta="Peso (kg)" error={errors.pesoKg?.message}>
            <Input id="pesoKg" inputMode="decimal" {...register("pesoKg")} />
          </Campo>
        )}
        <Campo
          id="motivo"
          etiqueta={tipo === "MUERTE" ? "Causa de la muerte" : "Motivo"}
          requerido={tipo === "MUERTE" || tipo === "DESCARTE"}
          error={errors.motivo?.message}
          className="sm:col-span-2"
        >
          <Textarea id="motivo" rows={2} {...register("motivo")} />
        </Campo>
      </div>
      {tipo === "VENTA" && (
        <p className="text-muted-foreground mt-3 text-xs">
          La venta crea automáticamente el ingreso en Costos (no hay que digitarlo otra vez).
        </p>
      )}
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={alTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} variant={salida ? "destructive" : "default"}>
          {isSubmitting ? "Guardando…" : "Registrar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BotonEliminarAnimal({ animalId, numero }: { animalId: string; numero: string }) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive"
        onClick={() => setAbierto(true)}
      >
        <Trash2 /> Eliminar
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar el registro {numero}?</DialogTitle>
            <DialogDescription>
              Úsalo solo para registros creados por error. Si el animal se vendió, murió o se
              descartó, registra un movimiento. El número de chapeta quedará libre y el cambio queda
              en la auditoría.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pendiente}
              onClick={() =>
                iniciar(async () => {
                  const r = await eliminarAnimal(animalId);
                  if (r.ok) {
                    toast.success("Registro eliminado.");
                    router.push("/animales");
                  } else {
                    toast.error(r.error);
                    setAbierto(false);
                  }
                })
              }
            >
              <Trash2 /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
