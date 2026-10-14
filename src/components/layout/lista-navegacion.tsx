"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SeccionNav } from "@/lib/navegacion";
import { cn } from "@/lib/utils";
import { Icono } from "./iconos";

/** Activa si la ruta coincide o es una subruta (excepto /animales vs /animales/importar). */
export function esRutaActiva(pathname: string, href: string, todas: string[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(href + "/")) return false;
  // Si existe una ruta más específica que también coincide, esa es la activa.
  return !todas.some((o) => o !== href && o.startsWith(href + "/") && pathname.startsWith(o));
}

export function ListaNavegacion({
  secciones,
  alNavegar,
}: {
  secciones: SeccionNav[];
  alNavegar?: () => void;
}) {
  const pathname = usePathname();
  const todas = secciones.flatMap((s) => s.paginas.map((p) => p.href));
  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {secciones.map((s) => (
        <div key={s.titulo}>
          <p className="text-sidebar-muted mb-1.5 px-3 text-[11px] font-semibold tracking-wider uppercase">
            {s.titulo}
          </p>
          <ul className="flex flex-col gap-0.5">
            {s.paginas.map((p) => {
              const activa = esRutaActiva(pathname, p.href, todas);
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    onClick={alNavegar}
                    aria-current={activa ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      activa
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icono nombre={p.icono} className="size-4 shrink-0" />
                    <span className="truncate">{p.titulo}</span>
                    {p.estado !== "lista" && (
                      <span
                        className="bg-sidebar-muted/60 ml-auto size-1.5 shrink-0 rounded-full"
                        title="Próximamente"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
