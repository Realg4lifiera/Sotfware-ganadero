"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { DefCampo, Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function CampoFormulario({
  campo,
  register,
  errores,
  opcionesDinamicas,
  valorInicial,
}: {
  campo: DefCampo;
  /** Valor inicial pintado en el HTML del servidor (antes de hidratar). */
  valorInicial?: string | boolean;
  register: UseFormRegister<ValoresFormulario>;
  errores: FieldErrors<ValoresFormulario> | Record<string, { message?: string } | undefined>;
  opcionesDinamicas?: Record<string, Opcion[]>;
}) {
  const id = `campo-${campo.nombre}`;
  const error = (errores as Record<string, { message?: string } | undefined>)[campo.nombre]
    ?.message;
  const ayuda = campo.ayuda ? <p className="text-muted-foreground text-xs">{campo.ayuda}</p> : null;
  const mensaje = error ? (
    <p id={`${id}-error`} className="text-destructive text-xs font-medium">
      {error}
    </p>
  ) : null;
  const inicial =
    campo.tipo === "booleano"
      ? { defaultChecked: valorInicial === true }
      : valorInicial !== undefined
        ? { defaultValue: String(valorInicial) }
        : {};
  const comunes = {
    id,
    ...inicial,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    ...register(campo.nombre),
  };

  if (campo.tipo === "booleano") {
    return (
      <div className={cn("flex flex-col gap-1", campo.anchoCompleto && "sm:col-span-2")}>
        <label htmlFor={id} className="flex min-h-10 items-center gap-3 text-sm font-medium">
          <input type="checkbox" className="size-5 accent-[var(--primary)]" {...comunes} />
          {campo.etiqueta}
        </label>
        {ayuda}
        {mensaje}
      </div>
    );
  }

  let control: React.ReactNode;
  if (campo.tipo === "textarea") {
    control = <Textarea rows={3} {...comunes} />;
  } else if (campo.tipo === "opcion") {
    const lista = campo.opciones ?? opcionesDinamicas?.[campo.opcionesDe ?? ""] ?? [];
    control = (
      <NativeSelect {...comunes}>
        <option value="">{campo.requerido ? "Selecciona…" : "— Ninguno —"}</option>
        {lista.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </NativeSelect>
    );
  } else {
    const tipo = campo.tipo === "fecha" ? "date" : campo.tipo === "email" ? "email" : "text";
    const numerico = campo.tipo === "decimal" || campo.tipo === "entero";
    control = (
      <div className="relative">
        <Input
          type={tipo}
          inputMode={numerico ? (campo.tipo === "entero" ? "numeric" : "decimal") : undefined}
          className={cn(campo.sufijo && "pr-14")}
          {...comunes}
        />
        {campo.sufijo && (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
            {campo.sufijo}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", campo.anchoCompleto && "sm:col-span-2")}>
      <Label htmlFor={id}>
        {campo.etiqueta}
        {campo.requerido && <span className="text-destructive">*</span>}
      </Label>
      {control}
      {ayuda}
      {mensaje}
    </div>
  );
}
