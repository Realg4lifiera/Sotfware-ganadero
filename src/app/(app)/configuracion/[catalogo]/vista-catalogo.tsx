"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { catalogoPorClave } from "@/lib/catalogos/definiciones";
import type { FilaCatalogo } from "@/lib/catalogos/servidor";
import {
  esquemaDesdeCampos,
  valoresVacios,
  type Opcion,
  type ValoresFormulario,
} from "@/lib/formularios/campos";
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
import { CampoFormulario } from "@/components/formularios/campo-formulario";
import { TablaDatos } from "@/components/tabla-datos/tabla-datos";
import {
  cambiarActivoRegistro,
  eliminarRegistroCatalogo,
  guardarRegistroCatalogo,
} from "./acciones";

export function VistaCatalogo({
  clave,
  filas,
  opcionesDinamicas,
}: {
  clave: string;
  filas: FilaCatalogo[];
  opcionesDinamicas: Record<string, Opcion[]>;
}) {
  const def = catalogoPorClave(clave)!;
  const [editando, setEditando] = useState<FilaCatalogo | "nuevo" | null>(null);
  const [eliminando, setEliminando] = useState<FilaCatalogo | null>(null);
  const [pendiente, iniciar] = useTransition();

  const columnas = useMemo<ColumnDef<FilaCatalogo, unknown>[]>(() => {
    const cols: ColumnDef<FilaCatalogo, unknown>[] = def.campos
      .filter((c) => c.enLista)
      .map((c, i) => ({
        id: c.nombre,
        header: c.etiqueta,
        accessorFn: (f) => f.celdas[c.nombre],
        cell: ({ getValue }) =>
          i === 0 ? (
            <span className="font-semibold">{getValue() as string}</span>
          ) : (
            (getValue() as string)
          ),
        meta: {
          ocultarEnMovil: i >= 2,
          claseCelda:
            c.tipo === "decimal" || c.tipo === "entero" ? "text-right tabular-nums" : undefined,
          claseCabecera: c.tipo === "decimal" || c.tipo === "entero" ? "text-right" : undefined,
        },
      }));
    cols.push({
      id: "estado",
      header: "Estado",
      accessorFn: (f) => (f.activo ? "Activo" : "Inactivo"),
      cell: ({ row }) =>
        row.original.activo ? (
          <Badge variant="secondary">Activo</Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
        ),
    });
    cols.push({
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      meta: { claseCelda: "w-12 text-right" },
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Acciones"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => setEditando(row.original)}>
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                iniciar(async () => {
                  const r = await cambiarActivoRegistro(
                    clave,
                    row.original.id,
                    !row.original.activo,
                  );
                  if (r.ok) toast.success(row.original.activo ? "Desactivado." : "Activado.");
                  else toast.error(r.error);
                })
              }
            >
              <Power /> {row.original.activo ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => setEliminando(row.original)}
            >
              <Trash2 className="text-destructive" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
    return cols;
  }, [def, clave]);

  return (
    <>
      <TablaDatos
        columnas={columnas}
        datos={filas}
        placeholderBusqueda={`Buscar ${def.titulo.toLowerCase()}…`}
        alClicFila={(f) => setEditando(f)}
        claseFila={(f) => (f.activo ? undefined : "opacity-60")}
        vacio={`Aún no hay ${def.titulo.toLowerCase()}.`}
        barra={
          <Button className="sm:ml-auto" onClick={() => setEditando("nuevo")}>
            <Plus /> Nuevo {def.singular}
          </Button>
        }
      />

      <Dialog open={editando !== null} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-2xl">
          {editando !== null && (
            <FormularioCatalogo
              key={editando === "nuevo" ? "nuevo" : editando.id}
              clave={clave}
              fila={editando === "nuevo" ? null : editando}
              opcionesDinamicas={opcionesDinamicas}
              alTerminar={() => setEditando(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={eliminando !== null} onOpenChange={(o) => !o && setEliminando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar {def.singular}?</DialogTitle>
            <DialogDescription>
              «{eliminando?.celdas[def.campos[0].nombre]}» dejará de aparecer. El cambio queda en la
              auditoría. Si tiene registros relacionados no se podrá eliminar; en ese caso
              desactívalo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminando(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pendiente}
              onClick={() =>
                iniciar(async () => {
                  const r = await eliminarRegistroCatalogo(clave, eliminando!.id);
                  if (r.ok) {
                    toast.success("Eliminado.");
                    setEliminando(null);
                  } else toast.error(r.error);
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

function FormularioCatalogo({
  clave,
  fila,
  opcionesDinamicas,
  alTerminar,
}: {
  clave: string;
  fila: FilaCatalogo | null;
  opcionesDinamicas: Record<string, Opcion[]>;
  alTerminar: () => void;
}) {
  const def = catalogoPorClave(clave)!;
  const esquema = useMemo(() => esquemaDesdeCampos(def.campos), [def]);
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFormulario>({
    // El esquema transforma los valores; aquí solo se usa para validar.
    resolver: zodResolver(esquema) as never,
    defaultValues: fila?.valores ?? valoresVacios(def.campos),
  });

  const enviar = async (valores: ValoresFormulario) => {
    const r = await guardarRegistroCatalogo(clave, fila?.id ?? null, valores);
    if (r.ok) {
      toast.success(
        fila
          ? "Cambios guardados."
          : `${def.singular[0].toUpperCase()}${def.singular.slice(1)} creado.`,
      );
      alTerminar();
      return;
    }
    for (const [campo, mensaje] of Object.entries(r.erroresCampo ?? {}))
      setError(campo, { message: mensaje });
    toast.error(r.error);
  };

  return (
    // El resolver entrega valores ya transformados; al servidor se envían los crudos
    // (el servidor valida de nuevo con el mismo esquema).
    <form onSubmit={handleSubmit(() => enviar(getValues()))} noValidate>
      <DialogHeader className="mb-4">
        <DialogTitle>{fila ? `Editar ${def.singular}` : `Nuevo ${def.singular}`}</DialogTitle>
        <DialogDescription>{def.descripcion}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        {def.campos.map((c) => (
          <CampoFormulario
            key={c.nombre}
            campo={c}
            register={register}
            errores={errors}
            opcionesDinamicas={opcionesDinamicas}
          />
        ))}
      </div>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={alTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
