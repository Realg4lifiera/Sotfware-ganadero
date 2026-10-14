"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Paperclip, Save } from "lucide-react";
import { toast } from "sonner";
import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { formatoCOP } from "@/lib/formato";
import {
  CAMPOS_GASTO_BASICOS,
  CAMPOS_GASTO_DETALLE,
  esquemaGasto,
  totalesDesdeFormulario,
} from "@/lib/validaciones/gastos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Campo } from "@/components/formularios/campo";
import { CampoFormulario } from "@/components/formularios/campo-formulario";
import { useHidratado } from "@/components/formularios/use-hidratado";
import { cn } from "@/lib/utils";
import { crearGasto, editarGasto, subirSoporte } from "./acciones";

export function FormularioGasto({
  id,
  valores,
  opcionesDinamicas,
  ivaEsCosto,
}: {
  /** Si viene, se edita; si no, se crea. */
  id?: string;
  valores: ValoresFormulario;
  opcionesDinamicas: Record<string, Opcion[]>;
  ivaEsCosto: boolean;
}) {
  const creando = !id;
  const router = useRouter();
  const hidratado = useHidratado();
  const [soporte, setSoporte] = useState<File | null>(null);
  // El detalle se abre si ya tiene datos (al editar) o si el usuario lo pide.
  const [detalle, setDetalle] = useState(
    () =>
      !creando || CAMPOS_GASTO_DETALLE.some((c) => c.porDefecto === undefined && valores[c.nombre]),
  );
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquemaGasto) as never,
    defaultValues: valores,
  });
  const [cantidad, valorUnitario, descuento, ivaPorcentaje] = useWatch({
    control,
    name: ["cantidad", "valorUnitario", "descuento", "ivaPorcentaje"],
  });
  const t = totalesDesdeFormulario({ cantidad, valorUnitario, descuento, ivaPorcentaje });

  const enviar = async () => {
    const r = creando ? await crearGasto(getValues()) : await editarGasto(id, getValues());
    if (!r.ok) {
      for (const [c, m] of Object.entries(r.erroresCampo ?? {})) setError(c, { message: m });
      // Un error en un campo del detalle debe quedar a la vista.
      if (
        Object.keys(r.erroresCampo ?? {}).some((c) =>
          CAMPOS_GASTO_DETALLE.some((d) => d.nombre === c),
        )
      )
        setDetalle(true);
      toast.error(r.error);
      return;
    }
    if (soporte) {
      const datos = new FormData();
      datos.set("archivo", soporte);
      const s = await subirSoporte(r.datos, datos);
      if (!s.ok) toast.error(`El gasto se guardó, pero el soporte no: ${s.error}`);
    }
    toast.success(creando ? "Gasto registrado." : "Cambios guardados.");
    router.push(creando ? "/costos/gastos" : `/costos/gastos/${id}`);
    router.refresh();
  };

  const campo = (c: (typeof CAMPOS_GASTO_BASICOS)[number]) => (
    <CampoFormulario
      key={c.nombre}
      campo={c}
      register={register}
      errores={errors}
      opcionesDinamicas={opcionesDinamicas}
      valorInicial={valores[c.nombre]}
    />
  );

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Gasto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {CAMPOS_GASTO_BASICOS.map(campo)}
          {creando && (
            <Campo
              id="soporte"
              etiqueta="Soporte (foto o PDF de la factura)"
              ayuda="Opcional. Hasta 10 MB."
              className="sm:col-span-2"
            >
              <Input
                id="soporte"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                capture="environment"
                onChange={(e) => setSoporte(e.target.files?.[0] ?? null)}
              />
            </Campo>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <button
          type="button"
          onClick={() => setDetalle((d) => !d)}
          className="font-display flex items-center justify-between px-5 py-4 text-left text-lg font-semibold"
          aria-expanded={detalle}
        >
          Más detalles: descuento, IVA, factura, asignación…
          <ChevronDown className={cn("size-5 transition-transform", detalle && "rotate-180")} />
        </button>
        {/* Se oculta con CSS (no se desmonta) para conservar lo escrito. */}
        <CardContent className={cn("grid gap-4 pb-5 sm:grid-cols-2", !detalle && "hidden")}>
          {CAMPOS_GASTO_DETALLE.map(campo)}
        </CardContent>
      </Card>

      <div className="bg-card/95 sticky bottom-20 z-10 flex flex-col gap-3 rounded-xl border p-4 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
        <dl className="grid grid-cols-3 gap-3 text-sm sm:flex sm:gap-6">
          <div>
            <dt className="text-muted-foreground text-xs">Subtotal</dt>
            <dd className="tabular-nums">{formatoCOP(t.base)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">
              IVA {ivaEsCosto ? "" : "(no es costo)"}
            </dt>
            <dd className="tabular-nums">{formatoCOP(t.valorIva)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Total</dt>
            <dd className="font-display text-xl font-semibold tabular-nums">
              {formatoCOP(t.total)}
            </dd>
          </div>
        </dl>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={!hidratado || isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {soporte ? <Paperclip /> : <Save />}
            {isSubmitting ? "Guardando…" : creando ? "Registrar gasto" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
