"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import {
  CAMPOS_ANIMAL,
  CAMPOS_ANIMAL_CREACION,
  esquemaCrearAnimal,
  esquemaEditarAnimal,
} from "@/lib/validaciones/animales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampoFormulario } from "@/components/formularios/campo-formulario";
import { useHidratado } from "@/components/formularios/use-hidratado";
import { crearAnimal, editarAnimal } from "./acciones";

const TODOS = [...CAMPOS_ANIMAL, ...CAMPOS_ANIMAL_CREACION];
const campo = (nombre: string) => TODOS.find((c) => c.nombre === nombre)!;

const SECCIONES: { titulo: string; descripcion?: string; campos: string[]; soloCrear?: boolean }[] =
  [
    { titulo: "Identificación", campos: ["numero", "nombre", "especie", "sexo", "razaId"] },
    {
      titulo: "Nacimiento y origen",
      campos: [
        "origen",
        "fechaNacimiento",
        "fechaNacimientoEstimada",
        "fechaIngreso",
        "pesoNacimientoKg",
        "valorCompra",
      ],
    },
    {
      titulo: "Genealogía",
      descripcion: "Madre del hato y toro padre.",
      campos: ["madreId", "padreId"],
    },
    {
      titulo: "Ubicación",
      descripcion: "Después se cambia con un traslado (queda en el historial).",
      campos: ["loteId", "potreroId"],
      soloCrear: true,
    },
    {
      titulo: "Reproducción y producción",
      descripcion: "Estado al registrarla. Luego lo actualizan los eventos reproductivos.",
      campos: ["estadoReproductivo", "numeroPartos", "enProduccion"],
      soloCrear: true,
    },
    { titulo: "Observaciones", campos: ["observaciones"] },
  ];

export function FormularioAnimal({
  id,
  valores,
  opcionesDinamicas,
  hoyISO,
}: {
  /** Si viene, se edita; si no, se crea. */
  id?: string;
  /** Fecha de hoy en Bogotá ("AAAA-MM-DD"). */
  hoyISO: string;
  valores: ValoresFormulario;
  opcionesDinamicas: Record<string, Opcion[]>;
}) {
  const creando = !id;
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
    resolver: zodResolver(creando ? esquemaCrearAnimal : esquemaEditarAnimal) as never,
    defaultValues: valores,
    // Los campos ocultos (p. ej. reproducción en un macho) no se envían.
    shouldUnregister: true,
  });

  const [sexo, especie, origen, fechaNacimiento] = useWatch({
    control,
    name: ["sexo", "especie", "origen", "fechaNacimiento"],
  });
  const hembraBovina = sexo === "HEMBRA" && especie === "BOVINO";
  const nacido = origen === "NACIDO";

  // Si nació en la finca, ingresó el día que nació; si fue comprado y no hay fecha de
  // ingreso, se propone hoy.
  useEffect(() => {
    if (nacido) {
      if (fechaNacimiento) setValue("fechaIngreso", String(fechaNacimiento));
    } else if (!getValues("fechaIngreso")) {
      setValue("fechaIngreso", hoyISO);
    }
  }, [nacido, fechaNacimiento, setValue, getValues, hoyISO]);

  const visible = (nombre: string) => {
    if (nombre === "valorCompra") return creando && !nacido;
    if (nombre === "pesoNacimientoKg") return nacido;
    if (["estadoReproductivo", "numeroPartos", "enProduccion"].includes(nombre))
      return hembraBovina;
    return true;
  };

  const enviar = async () => {
    const datos = getValues();
    const r = creando ? await crearAnimal(datos) : await editarAnimal(id, datos);
    if (r.ok) {
      toast.success(creando ? "Animal registrado." : "Cambios guardados.");
      const destino = creando && typeof r.datos === "string" ? r.datos : id;
      router.push(`/animales/${destino}`);
      return;
    }
    for (const [c, m] of Object.entries(r.erroresCampo ?? {})) setError(c, { message: m });
    toast.error(r.error);
  };

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="flex flex-col gap-4">
      {SECCIONES.filter((s) => creando || !s.soloCrear).map((s) => {
        const campos = s.campos.filter(visible);
        if (campos.length === 0) return null;
        return (
          <Card key={s.titulo}>
            <CardHeader>
              <CardTitle>{s.titulo}</CardTitle>
              {s.descripcion && <CardDescription>{s.descripcion}</CardDescription>}
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campos.map((n) => {
                const c = campo(n);
                const def =
                  n === "fechaIngreso" && nacido
                    ? { ...c, ayuda: "Igual a la fecha de nacimiento." }
                    : c;
                return (
                  <CampoFormulario
                    key={n}
                    campo={def}
                    register={register}
                    errores={errors}
                    opcionesDinamicas={opcionesDinamicas}
                    valorInicial={valores[n]}
                  />
                );
              })}
            </CardContent>
          </Card>
        );
      })}
      <div className="sticky bottom-20 z-10 flex justify-end gap-2 lg:bottom-4">
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={!hidratado || isSubmitting} className="shadow-md">
          <Save /> {isSubmitting ? "Guardando…" : creando ? "Registrar animal" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
