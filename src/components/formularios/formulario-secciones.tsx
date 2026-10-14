"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { ResultadoAccion } from "@/lib/errores";
import type { DefCampo, Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampoFormulario } from "./campo-formulario";
import { useHidratado } from "./use-hidratado";

export interface SeccionFormulario {
  titulo: string;
  descripcion?: string;
  campos: DefCampo[];
}

/**
 * Formulario declarativo por secciones (registros de los módulos). Valida en el cliente
 * con el mismo esquema del servidor, envía los valores crudos y muestra los errores.
 */
export function FormularioSecciones({
  secciones,
  esquema,
  valores,
  opcionesDinamicas,
  enviar,
  destino,
  textoBoton = "Guardar",
  mensajeExito = "Guardado.",
  resumen,
  alCambiar,
}: {
  secciones: SeccionFormulario[];
  esquema: ZodType;
  valores: ValoresFormulario;
  opcionesDinamicas?: Record<string, Opcion[]>;
  enviar: (valores: ValoresFormulario) => Promise<ResultadoAccion<string | void>>;
  /** A dónde ir después de guardar (recibe el id devuelto, si hay). */
  destino: (id: string | undefined) => string;
  textoBoton?: string;
  mensajeExito?: string;
  /** Resumen en vivo (totales) junto al botón. */
  resumen?: (valores: ValoresFormulario) => React.ReactNode;
  /** Ajustes automáticos al cambiar un campo (p. ej. proponer el salario del trabajador). */
  alCambiar?: (
    campo: string,
    valores: ValoresFormulario,
    fijar: (campo: string, valor: string) => void,
  ) => void;
}) {
  const router = useRouter();
  const hidratado = useHidratado();
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquema as never) as never,
    defaultValues: valores,
  });
  const actuales = useWatch({ control }) as ValoresFormulario;

  const registrar: typeof register = (nombre, opciones) => {
    const r = register(nombre, opciones);
    if (!alCambiar) return r;
    return {
      ...r,
      onChange: async (e) => {
        await r.onChange(e);
        alCambiar(nombre, getValues(), (c, v) => setValue(c, v, { shouldValidate: false }));
      },
    };
  };

  const guardar = async () => {
    const r = await enviar(getValues());
    if (!r.ok) {
      for (const [c, m] of Object.entries(r.erroresCampo ?? {})) setError(c, { message: m });
      toast.error(r.error);
      return;
    }
    toast.success(mensajeExito);
    router.push(destino(typeof r.datos === "string" ? r.datos : undefined));
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
      {secciones.map((s) => (
        <Card key={s.titulo}>
          <CardHeader>
            <CardTitle>{s.titulo}</CardTitle>
            {s.descripcion && <CardDescription>{s.descripcion}</CardDescription>}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.campos.map((c) => (
              <CampoFormulario
                key={c.nombre}
                campo={c}
                register={registrar}
                errores={errors}
                opcionesDinamicas={opcionesDinamicas}
                valorInicial={valores[c.nombre]}
              />
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="bg-card/95 sticky bottom-20 z-10 flex flex-col gap-3 rounded-xl border p-4 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
        <div className="min-w-0">{resumen?.(actuales)}</div>
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
            <Save /> {isSubmitting ? "Guardando…" : textoBoton}
          </Button>
        </div>
      </div>
    </form>
  );
}
