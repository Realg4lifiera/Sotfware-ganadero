"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, MoreHorizontal, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { ETIQUETA_ROL } from "@/lib/permisos";
import {
  crearUsuarioSchema,
  editarUsuarioSchema,
  restablecerClaveSchema,
  ROLES,
} from "@/lib/validaciones/usuarios";
import type { ResultadoAccion } from "@/lib/errores";
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
import { cambiarEstadoUsuario, crearUsuario, editarUsuario, restablecerClave } from "./acciones";

export interface FilaUsuario {
  id: string;
  nombre: string;
  usuario: string;
  email: string;
  rol: (typeof ROLES)[number];
  rolEtiqueta: string;
  activo: boolean;
  debeCambiarClave: boolean;
  ultimoAcceso: string;
  soyYo: boolean;
}

type Dialogo =
  { tipo: "crear" } | { tipo: "editar"; fila: FilaUsuario } | { tipo: "clave"; fila: FilaUsuario };

export function VistaUsuarios({ filas }: { filas: FilaUsuario[] }) {
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [, iniciar] = useTransition();

  const columnas = useMemo<ColumnDef<FilaUsuario, unknown>[]>(
    () => [
      {
        id: "nombre",
        header: "Nombre",
        accessorFn: (f) => `${f.nombre} ${f.usuario}`,
        cell: ({ row: { original: f } }) => (
          <div className="flex flex-col">
            <span className="font-semibold">
              {f.nombre}{" "}
              {f.soyYo && <span className="text-muted-foreground text-xs font-normal">(tú)</span>}
            </span>
            <span className="text-muted-foreground text-xs">{f.usuario}</span>
          </div>
        ),
      },
      { id: "rol", header: "Rol", accessorKey: "rolEtiqueta" },
      {
        id: "ultimoAcceso",
        header: "Último acceso",
        accessorKey: "ultimoAcceso",
        meta: { ocultarEnMovil: true },
      },
      {
        id: "estado",
        header: "Estado",
        accessorFn: (f) => (f.activo ? "Activo" : "Inactivo"),
        cell: ({ row: { original: f } }) => (
          <div className="flex flex-wrap gap-1">
            {f.activo ? (
              <Badge variant="secondary">Activo</Badge>
            ) : (
              <Badge variant="outline">Inactivo</Badge>
            )}
            {f.debeCambiarClave && <Badge variant="warning">Clave temporal</Badge>}
          </div>
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
              <DropdownMenuItem onSelect={() => setDialogo({ tipo: "clave", fila: f })}>
                <KeyRound /> Restablecer contraseña
              </DropdownMenuItem>
              {!f.soyYo && (
                <DropdownMenuItem
                  onSelect={() =>
                    iniciar(async () => {
                      const r = await cambiarEstadoUsuario(f.id, !f.activo);
                      if (r.ok)
                        toast.success(f.activo ? "Usuario desactivado." : "Usuario activado.");
                      else toast.error(r.error);
                    })
                  }
                >
                  <Power /> {f.activo ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
              )}
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
        placeholderBusqueda="Buscar usuario…"
        claseFila={(f) => (f.activo ? undefined : "opacity-60")}
        barra={
          <Button className="sm:ml-auto" onClick={() => setDialogo({ tipo: "crear" })}>
            <Plus /> Nuevo usuario
          </Button>
        }
      />
      <Dialog open={dialogo !== null} onOpenChange={(o) => !o && setDialogo(null)}>
        <DialogContent>
          {dialogo?.tipo === "crear" && <FormularioCrear alTerminar={() => setDialogo(null)} />}
          {dialogo?.tipo === "editar" && (
            <FormularioEditar
              key={dialogo.fila.id}
              fila={dialogo.fila}
              alTerminar={() => setDialogo(null)}
            />
          )}
          {dialogo?.tipo === "clave" && (
            <FormularioClave
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
  r: ResultadoAccion,
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

function SelectRol(props: React.ComponentProps<"select">) {
  return (
    <NativeSelect {...props}>
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ETIQUETA_ROL[r]}
        </option>
      ))}
    </NativeSelect>
  );
}

function FormularioCrear({ alTerminar }: { alTerminar: () => void }) {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: { nombre: "", usuario: "", email: "", rol: "MAYORDOMO" as const, clave: "" },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(async () =>
        aplicarResultado(await crearUsuario(getValues()), setError, "Usuario creado.", alTerminar),
      )}
    >
      <DialogHeader className="mb-4">
        <DialogTitle>Nuevo usuario</DialogTitle>
        <DialogDescription>
          Comparte la contraseña temporal; deberá cambiarla al entrar.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="nombre" etiqueta="Nombre" requerido error={errors.nombre?.message}>
          <Input id="nombre" {...register("nombre")} />
        </Campo>
        <Campo id="usuario" etiqueta="Usuario" requerido error={errors.usuario?.message}>
          <Input id="usuario" autoCapitalize="none" {...register("usuario")} />
        </Campo>
        <Campo id="email" etiqueta="Correo" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Campo>
        <Campo id="rol" etiqueta="Rol" requerido error={errors.rol?.message}>
          <SelectRol id="rol" {...register("rol")} />
        </Campo>
        <Campo
          id="clave"
          etiqueta="Contraseña temporal"
          requerido
          error={errors.clave?.message}
          className="sm:col-span-2"
        >
          <Input id="clave" type="text" autoComplete="off" {...register("clave")} />
        </Campo>
      </div>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={alTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Crear usuario
        </Button>
      </DialogFooter>
    </form>
  );
}

function FormularioEditar({ fila, alTerminar }: { fila: FilaUsuario; alTerminar: () => void }) {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: { nombre: fila.nombre, email: fila.email, rol: fila.rol },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(async () =>
        aplicarResultado(
          await editarUsuario(fila.id, getValues()),
          setError,
          "Cambios guardados.",
          alTerminar,
        ),
      )}
    >
      <DialogHeader className="mb-4">
        <DialogTitle>Editar usuario</DialogTitle>
        <DialogDescription>Usuario: {fila.usuario}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <Campo id="nombre" etiqueta="Nombre" requerido error={errors.nombre?.message}>
          <Input id="nombre" {...register("nombre")} />
        </Campo>
        <Campo id="email" etiqueta="Correo" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Campo>
        <Campo id="rol" etiqueta="Rol" requerido error={errors.rol?.message}>
          <SelectRol id="rol" {...register("rol")} />
        </Campo>
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

function FormularioClave({ fila, alTerminar }: { fila: FilaUsuario; alTerminar: () => void }) {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(restablecerClaveSchema), defaultValues: { clave: "" } });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(async () =>
        aplicarResultado(
          await restablecerClave(fila.id, getValues()),
          setError,
          "Contraseña restablecida.",
          alTerminar,
        ),
      )}
    >
      <DialogHeader className="mb-4">
        <DialogTitle>Restablecer contraseña</DialogTitle>
        <DialogDescription>
          {fila.nombre} ({fila.usuario}) deberá cambiarla la próxima vez que entre.
        </DialogDescription>
      </DialogHeader>
      <Campo
        id="clave"
        etiqueta="Nueva contraseña temporal"
        requerido
        error={errors.clave?.message}
      >
        <Input id="clave" type="text" autoComplete="off" {...register("clave")} />
      </Campo>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={alTerminar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Restablecer
        </Button>
      </DialogFooter>
    </form>
  );
}
