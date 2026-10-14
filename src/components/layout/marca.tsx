import Image from "next/image";
import Link from "next/link";

export function Marca({ nombreFinca }: { nombreFinca: string }) {
  return (
    <Link href="/tablero" className="flex items-center gap-3">
      <Image src="/insignia.png" alt="" width={36} height={36} className="size-9" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-display text-lg font-semibold tracking-wider">CAMPO VERDE</span>
        <span className="text-sidebar-muted truncate text-xs">{nombreFinca}</span>
      </span>
    </Link>
  );
}
