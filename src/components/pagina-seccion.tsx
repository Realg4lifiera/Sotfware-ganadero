import Link from "next/link";
import { forbidden } from "next/navigation";
import { NAVEGACION } from "@/lib/navegacion";
import { puedeAlguno } from "@/lib/permisos";
import { requiereSesion } from "@/lib/sesion";
import { Badge } from "@/components/ui/badge";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { Icono } from "@/components/layout/iconos";

/** Índice de un módulo: tarjetas con las páginas que el rol puede usar. */
export async function PaginaSeccion({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  const usuario = await requiereSesion();
  const seccion = NAVEGACION.find((s) => s.titulo === titulo);
  const paginas = (seccion?.paginas ?? []).filter((p) => puedeAlguno(usuario.rol, p.permisos));
  if (paginas.length === 0) forbidden();

  return (
    <>
      <EncabezadoPagina titulo={titulo} descripcion={descripcion} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {paginas.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="bg-card hover:border-primary/50 hover:bg-secondary/40 flex gap-3 rounded-xl border p-4 shadow-xs transition-colors"
          >
            <span className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Icono nombre={p.icono} className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2 font-semibold">
                {p.titulo}
                {p.estado !== "lista" && <Badge variant="secondary">Próximamente</Badge>}
              </span>
              <span className="text-muted-foreground text-sm">{p.descripcion}</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
