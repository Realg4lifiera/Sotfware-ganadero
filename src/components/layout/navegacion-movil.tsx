"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import type { PaginaNav, SeccionNav } from "@/lib/navegacion";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Icono } from "./iconos";
import { ListaNavegacion, esRutaActiva } from "./lista-navegacion";
import { Marca } from "./marca";

/** Menú lateral desplegable (botón hamburguesa) para celular. */
export function MenuDesplegable({
  secciones,
  nombreFinca,
}: {
  secciones: SeccionNav[];
  nombreFinca: string;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger className="hover:bg-sidebar-accent/60 rounded-md p-2" aria-label="Abrir menú">
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent lado="left" className="bg-sidebar text-sidebar-foreground overflow-y-auto">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <div className="border-sidebar-border border-b px-5 py-4">
          <Marca nombreFinca={nombreFinca} />
        </div>
        <ListaNavegacion secciones={secciones} alNavegar={() => setAbierto(false)} />
      </SheetContent>
    </Sheet>
  );
}

/** Barra inferior del celular: accesos principales + "Registrar" (formularios de campo). */
export function MenuInferior({
  secciones,
  registrosRapidos,
}: {
  secciones: SeccionNav[];
  registrosRapidos: PaginaNav[];
}) {
  const pathname = usePathname();
  const [registrar, setRegistrar] = useState(false);
  const todas = secciones.flatMap((s) => s.paginas);
  const hrefs = todas.map((p) => p.href);
  const principales = ["/tablero", "/animales", "/produccion/ordenos", "/reproduccion/celos"]
    .map((h) => todas.find((p) => p.href === h))
    .filter((p): p is PaginaNav => !!p)
    .slice(0, 3);

  const enlace = (p: PaginaNav) => {
    const activa = esRutaActiva(pathname, p.href, hrefs);
    return (
      <Link
        key={p.href}
        href={p.href}
        aria-current={activa ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
          activa ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icono nombre={p.icono} className="size-5" />
        <span className="max-w-full truncate px-1">{p.titulo}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-card/95 fixed inset-x-0 bottom-0 z-40 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {principales.slice(0, 2).map(enlace)}
      {registrosRapidos.length > 0 && (
        <Sheet open={registrar} onOpenChange={setRegistrar}>
          <SheetTrigger className="text-primary flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold">
            <span className="bg-primary text-primary-foreground -mt-5 flex size-11 items-center justify-center rounded-full shadow-md">
              <Plus className="size-6" />
            </span>
            Registrar
          </SheetTrigger>
          <SheetContent lado="bottom" className="bg-card p-5">
            <SheetTitle className="font-display mb-3 text-xl font-semibold">
              Registrar en campo
            </SheetTitle>
            <div className="grid grid-cols-2 gap-3 pb-[env(safe-area-inset-bottom)]">
              {registrosRapidos.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={() => setRegistrar(false)}
                  className="bg-secondary/50 hover:bg-accent flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold"
                >
                  <Icono nombre={p.icono} className="text-primary size-7" />
                  {p.titulo}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}
      {principales.slice(2).map(enlace)}
    </nav>
  );
}
