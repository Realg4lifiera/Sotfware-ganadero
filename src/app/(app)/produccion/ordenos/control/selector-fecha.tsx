"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { hoyISO } from "@/lib/fechas";

/** Cambia el día de la planilla (?fecha=AAAA-MM-DD). */
export function SelectorFecha({ fecha }: { fecha: string }) {
  const router = useRouter();
  return (
    <label className="mb-4 flex max-w-xs flex-col gap-1 text-sm">
      <span className="text-muted-foreground text-xs font-semibold">Fecha del control</span>
      <Input
        type="date"
        value={fecha}
        max={hoyISO()}
        onChange={(e) =>
          e.target.value && router.push(`/produccion/ordenos/control?fecha=${e.target.value}`)
        }
      />
    </label>
  );
}
