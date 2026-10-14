import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EstadoVacio } from "@/components/estado-vacio";

/** Lista de registros pensada para el celular (una fila tocable por registro). */
export function ListaSimple({
  filas,
  vacio,
}: {
  filas: { id: string; href: string; titulo: string; subtitulo?: string; valor?: string }[];
  vacio: string;
}) {
  if (filas.length === 0) return <EstadoVacio titulo={vacio} />;
  return (
    <ul className="bg-card divide-y overflow-hidden rounded-xl border">
      {filas.map((f) => (
        <li key={f.id}>
          <Link href={f.href} className="hover:bg-muted/40 flex items-center gap-3 px-4 py-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold tabular-nums">{f.titulo}</span>
              {f.subtitulo && (
                <span className="text-muted-foreground truncate text-xs">{f.subtitulo}</span>
              )}
            </span>
            {f.valor && <span className="text-sm tabular-nums">{f.valor}</span>}
            <ChevronRight className="text-muted-foreground size-4" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
