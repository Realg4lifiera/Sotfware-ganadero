"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { CAMPOS_FINCA, CAMPOS_HATO } from "@/lib/catalogos/finca";
import { esquemaDesdeCampos, type ValoresFormulario } from "@/lib/formularios/campos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampoFormulario } from "@/components/formularios/campo-formulario";
import { useHidratado } from "@/components/formularios/use-hidratado";
import { guardarFinca } from "./acciones";

const NOMBRES_IDEAL = CAMPOS_HATO.filter((c) => c.nombre.startsWith("ideal_")).map((c) => c.nombre);

export function FormularioFinca({ valores }: { valores: ValoresFormulario }) {
  const esquema = useMemo(() => esquemaDesdeCampos([...CAMPOS_FINCA, ...CAMPOS_HATO]), []);
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquema) as never,
    defaultValues: valores,
  });

  const hidratado = useHidratado();
  const ideales = useWatch({ control, name: NOMBRES_IDEAL });
  const suma = ideales.reduce<number>((s, v) => s + (Number(String(v).replace(",", ".")) || 0), 0);

  const enviar = async () => {
    const r = await guardarFinca(getValues());
    if (r.ok) return void toast.success("Datos de la finca guardados.");
    for (const [campo, mensaje] of Object.entries(r.erroresCampo ?? {}))
      setError(campo, { message: mensaje });
    toast.error(r.error);
  };

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPOS_FINCA.map((c) => (
            <CampoFormulario
              key={c.nombre}
              campo={c}
              register={register}
              errores={errors}
              valorInicial={valores[c.nombre]}
            />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Composición del hato</CardTitle>
          <CardDescription>
            Edades para calcular la categoría de cada animal y porcentaje ideal de cada categoría
            (debe sumar 100 %). Referente Colanta: tasa de descarte del 20 % anual.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPOS_HATO.map((c) => (
            <CampoFormulario
              key={c.nombre}
              campo={c}
              register={register}
              errores={errors}
              valorInicial={valores[c.nombre]}
            />
          ))}
          <p
            className={`self-end text-sm font-semibold ${Math.abs(suma - 100) > 0.01 ? "text-destructive" : "text-success"}`}
          >
            Suma: {suma.toLocaleString("es-CO")} %
          </p>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!hidratado || isSubmitting}>
          <Save /> {isSubmitting ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
