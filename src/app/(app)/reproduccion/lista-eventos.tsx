import Link from "next/link";
import { EstadoVacio } from "@/components/estado-vacio";
import { BotonAnular } from "./boton-anular";

export interface FilaEvento {
  id: string;
  hembraId: string;
  hembra: string;
  detalle: string;
  valor?: string;
  /** Es el último evento de la hembra y el usuario puede anularlo. */
  anulable: boolean;
}

/** Eventos reproductivos del mes: cada fila lleva a la hoja de vida de la hembra. */
export function ListaEventos({ filas, vacio }: { filas: FilaEvento[]; vacio: string }) {
  if (filas.length === 0) return <EstadoVacio titulo={vacio} />;
  return (
    <ul className="bg-card divide-y overflow-hidden rounded-xl border">
      {filas.map((f) => (
        <li key={f.id} className="flex items-center gap-2 px-4 py-3">
          <Link
            href={`/animales/${f.hembraId}?pestana=reproduccion`}
            className="flex min-w-0 flex-1 flex-col hover:underline"
          >
            <span className="font-semibold tabular-nums">{f.hembra}</span>
            <span className="text-muted-foreground truncate text-xs">{f.detalle}</span>
          </Link>
          {f.valor && <span className="text-sm whitespace-nowrap">{f.valor}</span>}
          {f.anulable && (
            <BotonAnular
              hembraId={f.hembraId}
              descripcion={`${f.hembra}: ${f.detalle}.`}
              compacto
            />
          )}
        </li>
      ))}
    </ul>
  );
}
