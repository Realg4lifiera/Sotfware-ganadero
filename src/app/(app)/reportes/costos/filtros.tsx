"use client";

import { useRouter } from "next/navigation";
import { AGRUPACIONES, ETIQUETA_AGRUPACION } from "@/lib/dominio/reporte-costos";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export function FiltrosReporteCostos({
  desde,
  hasta,
  por,
}: {
  desde: string;
  hasta: string;
  por: string;
}) {
  const router = useRouter();
  const ir = (cambios: Record<string, string>) =>
    router.push(`/reportes/costos?${new URLSearchParams({ desde, hasta, por, ...cambios })}`);
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 print:hidden">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground text-xs font-semibold">Desde</span>
        <Input
          type="month"
          value={desde}
          onChange={(e) => e.target.value && ir({ desde: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground text-xs font-semibold">Hasta</span>
        <Input
          type="month"
          value={hasta}
          onChange={(e) => e.target.value && ir({ hasta: e.target.value })}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1 text-sm sm:col-span-1">
        <span className="text-muted-foreground text-xs font-semibold">Agrupar por</span>
        <NativeSelect value={por} onChange={(e) => ir({ por: e.target.value })}>
          {AGRUPACIONES.map((a) => (
            <option key={a} value={a}>
              {ETIQUETA_AGRUPACION[a]}
            </option>
          ))}
        </NativeSelect>
      </label>
    </div>
  );
}
