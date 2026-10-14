"use client";

import Link from "next/link";
import { KeyRound, LogOut, UserCircle } from "lucide-react";
import { cerrarSesion } from "@/app/sesion/acciones";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function MenuUsuario({
  nombre,
  rol,
  className,
}: {
  nombre: string;
  rol: string;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "hover:bg-sidebar-accent/60 focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2",
          className,
        )}
      >
        <UserCircle className="size-7 shrink-0" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-semibold">{nombre}</span>
          <span className="truncate text-xs opacity-75">{rol}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {nombre}
          <span className="text-muted-foreground block text-xs font-normal">{rol}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/cuenta">
            <KeyRound />
            Mi cuenta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void cerrarSesion()}>
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
