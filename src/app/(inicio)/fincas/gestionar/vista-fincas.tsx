"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { crearFincaSchema, fincaSchema } from "@/lib/validaciones/fincas";
import type { ResultadoAccion } from "@/lib/errores";
import { formatoNumero } from "@/lib/formato";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Campo } from "@/components/formularios/campo";
import { TablaDatos } from "@/components/tabla-datos/tabla-datos";
import { cambiarEstadoFinca, crearFinca, editarFinca } from "./acciones";

export interface FilaFinca {
  id: number;
  nombre: string;
  departamento: string;
  municipio: string;
  vereda: string;
  ubicacion: string;
  activa: boolean;
  usuarios: number;
  animales: number;
}

type Dialogo = { tipo: "crear" } | { tipo: "editar"; fila: FilaFinca };

export function VistaFincas({ filas }: { filas: FilaFinca[] }) {
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [, iniciar] = useTransition();

  const columnas = useMemo<ColumnDef<FilaFinca, unknown>[]>(
    () => [
      {
        id: "nombre",
        header: "Finca",
        accessorFn: (f) => `${f.nombre} ${f.ubicacion}`,
        cell: ({ row: { original: f } }) => (
          <div className="flex flex-col">
            <span className="font-semibold">{f.nombre}</span>
            {f.ubicacion && <span className="text-muted-foreground text-xs">{f.ubicacion}</span>}
          </div>
        ),
      },
      {
        id: "animales",
        header: "Animales",
        accessorKey: "animales",
        cell: ({ row: { original: f } }) => formatoNumero(f.animales),
        meta: { claseCelda: "text-right tabular-nums" },
      },
      {
        id: "usuarios",
        header: "Usuarios con acceso",
        accessorKey: "usuarios",
        meta: { ocultarEnMovil: true, claseCelda: "text-right tabular-nums" },
      },
      {
        id: "estado",
        header: "Estado",
        accessorFn: (f) => (f.activa ? "Activa" : "Inactiva"),
        cell: ({ row: { original: f } }) =>
          f.activa ? (
            <Badge variant="secondary">Activa</Badge>
          ) : (
            <Badge variant="outline">Inactiva</Badge>
          ),
      },
      {
        id: "acciones",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        meta: { claseCelda: "w-12 text-right" },
        cell: ({ row: { original: f } }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Acciones">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDialogo({ tipo: "editar", fila: f })}>
                <Pencil /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  iniciar(async () => {
                    const r = await cambiarEstadoFinca(f.id, !f.activa);
                    if (r.ok) toast.success(f.activa ? "Finca desactivada." : "Finca activada.");
                    else toast.error(r.error);
                  })
                }
              >
                <Power /> {f.activa ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <TablaDatos
        columnas={columnas}
        datos={filas}
        placeholderBusqueda="Buscar finca…"
        claseFila={(f) => (f.activa ? undefined : "opacity-60")}
        barra={
          <Button className="sm:ml-auto" onClick={() => setDialogo({ tipo: "crear" })}>
            <Plus /> Nueva finca
          </Button>
        }
      />
      <Dialog open={dialogo !== null} onOpenChange={(o) => !o && setDialogo(null)}>
        <DialogContent>
          {dialogo?.tipo === "crear" && (
            <FormularioCrear fincas={filas} alTerminar={() => setDialogo(null)} />
          )}
          {dialogo?.tipo === "editar" && (
            <FormularioEditar
              key={dialogo.fila.id}
              fila={dialogo.fila}
              alTerminar={() => setDialogo(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function aplicarResultado(
  r: ResultadoAccion<unknown>,
  setError: (campo: never, e: { message: string }) => void,
  exito: string,
  alTerminar: () => void,
) {
  if (r.ok) {
    toast.success(exito);
    alTerminar();
    return;
  }
  for (const [c, m] of Object.entries(r.erroresCampo ?? {})) setError(c as never, { message: m });
  toast.error(r.error);
}

/** Campos comunes de crear y editar. */
function CamposFinca({
  register,
  errors,
}: {
  register: (campo: "nombre" | "departamento" | "municipio" | "vereda") => object;
  errors: Partial<Record<string, { message?: string }>>;
}) {
  return (
    <>
      <Campo
        id="nombre"
        etiqueta="Nombre"
        requerido
        error={errors.nombre?.message}
        className="sm:col-span-2"
      >
        <Input id="nombre" {...register("nombre")} />
      </Campo>
      <Campo id="departamento" etiqueta="Departamento" error={errors.departamento?.message}>
        <Input id="departamento" {...register("departamento")} />
      </Campo>
      <Campo id="municipio" etiqueta="Municipio" error={errors.municipio?.message}>
        <Input id="municipio" {...register("municipio")} />
      </Campo>
      <Campo id="vereda" etiqueta="Vereda" error={errors.vereda?.message} className="sm:col-span-2">
        <Input id="vereda" {...register("vereda")} />
      </Campo>
    </>
  );
}

function FormularioCrear({ fincas, alTerminar }: { fincas: FilaFinca[]; alTerminar: () => void }) {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(crearFincaSchema),
    defaultValues: {
      nombre: "",
      departamento: "",
      municipio: "",
      vereda: "",
      // Por defecto, los mismos parámetros de la primera finca.
      copiarDe: fincas[0] ? String(fincas[0].id) : "",
    },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(async () =>
        aplicarResultado(await crearFinca(getValues()), setError, "Finca creada.", alTerminar),
      )}
    >
      <DialogHeader className="mb-4">
        <DialogTitle>Nueva finca</DialogTitle>
        <DialogDescription>
          Se crea con sus centros de costo. Los demás datos (área, código de proveedor, potreros,
          lotes) se completan al entrar a ella, en Configuración.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <CamposFinca register={register} errors={errors} />
        <Campo
          id="copiarDe"
          etiqueta="Parámetros"
          error={errors.copiarDe?.message}
          ayuda="Reglas de categoría, % ideal del hato y parámetros reproductivos y de costos."
          className="sm:col-span-2"
        >
          <NativeSelect id="copiarDe" {...register("copiarDe")}>
            {fincas.map((f) => (
              <option key={f.id} value={f.id}>
                Copiar de {f.nombre}
              </option>
            ))}
            <option value="">Valores por defecto</option>
          </NativeSelect>
        </Campo>
      </div>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={alTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Crear finca
        </Button>
      </DialogFooter>
    </form>
  );
}

function FormularioEditar({ fila, alTerminar }: { fila: FilaFinca; alTerminar: () => void }) {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(fincaSchema),
    defaultValues: {
      nombre: fila.nombre,
      departamento: fila.departamento,
      municipio: fila.municipio,
      vereda: fila.vereda,
    },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(async () =>
        aplicarResultado(
          await editarFinca(fila.id, getValues()),
          setError,
          "Cambios guardados.",
          alTerminar,
        ),
      )}
    >
      <DialogHeader className="mb-4">
        <DialogTitle>Editar finca</DialogTitle>
        <DialogDescription>{fila.nombre}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <CamposFinca register={register} errors={errors} />
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
