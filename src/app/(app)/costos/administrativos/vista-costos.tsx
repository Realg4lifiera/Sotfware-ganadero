"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { formatoCOP } from "@/lib/formato";
import { TablaDatos } from "@/components/tabla-datos/tabla-datos";

export interface FilaCosto {
  id: string;
  concepto: string;
  rubro: string;
  inicio: string;
  periodo: string;
  total: number;
  cuota: number;
  asignacion: string;
  litros: string;
  porLitro: number | null;
}

export function VistaCostos({ filas }: { filas: FilaCosto[] }) {
  const router = useRouter();
  const columnas = useMemo<ColumnDef<FilaCosto, unknown>[]>(
    () => [
      {
        id: "concepto",
        header: "Concepto",
        accessorFn: (f) => `${f.concepto} ${f.rubro}`,
        cell: ({ row: { original: f } }) => (
          <div className="flex flex-col">
            <span className="font-semibold">{f.concepto}</span>
            <span className="text-muted-foreground text-xs">
              {f.rubro}
              {f.litros && ` · ${f.litros} · ${formatoCOP(f.porLitro)}/L`}
            </span>
          </div>
        ),
      },
      {
        id: "periodo",
        header: "Período",
        accessorKey: "periodo",
        cell: ({ row: { original: f } }) => (
          <div className="flex flex-col">
            <span>{f.periodo}</span>
            <span className="text-muted-foreground text-xs">desde {f.inicio}</span>
          </div>
        ),
        meta: { ocultarEnMovil: true },
      },
      {
        id: "asignacion",
        header: "Asignación",
        accessorKey: "asignacion",
        meta: { ocultarEnMovil: true },
      },
      {
        id: "total",
        header: "Valor total",
        accessorKey: "total",
        cell: ({ getValue }) => formatoCOP(getValue() as number),
        meta: {
          ocultarEnMovil: true,
          claseCelda: "text-right tabular-nums",
          claseCabecera: "text-right",
        },
      },
      {
        id: "cuota",
        header: "Este mes",
        accessorKey: "cuota",
        cell: ({ getValue }) => (
          <span className="font-semibold">{formatoCOP(getValue() as number)}</span>
        ),
        meta: { claseCelda: "text-right tabular-nums", claseCabecera: "text-right" },
      },
    ],
    [],
  );
  return (
    <TablaDatos
      columnas={columnas}
      datos={filas}
      placeholderBusqueda="Buscar concepto…"
      vacio="No hay gastos administrativos que cubran este mes."
      alClicFila={(f) => router.push(`/costos/administrativos/${f.id}`)}
    />
  );
}
