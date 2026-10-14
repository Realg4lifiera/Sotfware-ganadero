import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
  volver,
}: {
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
  volver?: { href: string; texto: string };
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {volver && (
          <Link
            href={volver.href}
            className="text-muted-foreground hover:text-foreground mb-1 inline-flex items-center gap-1 text-sm"
          >
            <ChevronLeft className="size-4" />
            {volver.texto}
          </Link>
        )}
        <h1 className="text-2xl font-semibold sm:text-3xl">{titulo}</h1>
        {descripcion && <p className="text-muted-foreground mt-1 text-sm">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}
