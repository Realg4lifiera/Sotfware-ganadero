import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

/**
 * Marca del software y finca activa. Con varias fincas (o para el administrador), el
 * nombre de la finca lleva a "Mis fincas" para cambiar de finca o crear otra.
 */
export function Marca({
  nombreFinca,
  cambiar = false,
}: {
  nombreFinca: string;
  cambiar?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link href="/tablero" className="shrink-0" aria-label="Tablero">
        <Image src="/insignia.png" alt="" width={36} height={36} className="size-9" />
      </Link>
      <span className="flex min-w-0 flex-col leading-tight">
        <Link href="/tablero" className="font-display text-lg font-semibold tracking-wider">
          CAMPO VERDE
        </Link>
        {cambiar ? (
          <Link
            href="/fincas"
            title="Cambiar de finca"
            className="text-sidebar-muted hover:text-sidebar-foreground inline-flex min-w-0 items-center gap-1 text-xs"
          >
            <span className="truncate">{nombreFinca}</span>
            <ArrowLeftRight className="size-3 shrink-0" aria-label="Cambiar de finca" />
          </Link>
        ) : (
          <span className="text-sidebar-muted truncate text-xs">{nombreFinca}</span>
        )}
      </span>
    </div>
  );
}
