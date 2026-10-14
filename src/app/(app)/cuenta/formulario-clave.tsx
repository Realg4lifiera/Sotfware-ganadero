"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cambiarMiClaveSchema } from "@/lib/validaciones/usuarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo } from "@/components/formularios/campo";
import { useHidratado } from "@/components/formularios/use-hidratado";
import { cambiarMiClave } from "./acciones";

export function FormularioClave() {
  const hidratado = useHidratado();
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(cambiarMiClaveSchema),
    defaultValues: { actual: "", nueva: "", confirmar: "" },
  });
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(async () => {
        const r = await cambiarMiClave(getValues());
        if (r.ok) {
          toast.success("Contraseña actualizada.");
          reset();
          return;
        }
        for (const [c, m] of Object.entries(r.erroresCampo ?? {}))
          setError(c as "actual", { message: m });
        toast.error(r.error);
      })}
    >
      <Campo id="actual" etiqueta="Contraseña actual" error={errors.actual?.message}>
        <Input
          id="actual"
          type="password"
          autoComplete="current-password"
          {...register("actual")}
        />
      </Campo>
      <Campo id="nueva" etiqueta="Nueva contraseña" error={errors.nueva?.message}>
        <Input id="nueva" type="password" autoComplete="new-password" {...register("nueva")} />
      </Campo>
      <Campo id="confirmar" etiqueta="Confirmar nueva contraseña" error={errors.confirmar?.message}>
        <Input
          id="confirmar"
          type="password"
          autoComplete="new-password"
          {...register("confirmar")}
        />
      </Campo>
      <Button type="submit" disabled={!hidratado || isSubmitting} className="self-start">
        Cambiar contraseña
      </Button>
    </form>
  );
}
