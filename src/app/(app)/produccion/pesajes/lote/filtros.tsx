"use client";

import { useRouter } from "next/navigation";
import { hoyISO } from "@/lib/fechas";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export function FiltrosPesajeLote({
  lotes,
  loteId,
  fecha,
  metodo,
}: {
  lotes: { id: string; nombre: string }[];
  loteId: string;
  fecha: string;
  metodo: string;
}) {
  const router = useRouter();
  const ir = (cambios: Record<string, string>) => {
    const p = new URLSearchParams({ lote: loteId, fecha, metodo, ...cambios });
    router.push(`/produccion/pesajes/lote?${p}`);
  };
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground text-xs font-semibold">Lote</span>
        <NativeSelect value={loteId} onChange={(e) => ir({ lote: e.target.value })}>
          <option value="">Selecciona…</option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </NativeSelect>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground text-xs font-semibold">Fecha</span>
        <Input
          type="date"
          value={fecha}
          max={hoyISO()}
          onChange={(e) => e.target.value && ir({ fecha: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground text-xs font-semibold">Método</span>
        <NativeSelect value={metodo} onChange={(e) => ir({ metodo: e.target.value })}>
          <option value="BASCULA">Báscula</option>
          <option value="CINTA">Cinta</option>
        </NativeSelect>
      </label>
    </div>
  );
}
