"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { formatoCOP, formatoNumero } from "@/lib/formato";
import { TablaDatos } from "@/components/tabla-datos/tabla-datos";

export interface FilaIngreso {
  id: string;
  fecha: string;
  fechaOrden: string;
  concepto: string;
  tipo: string;
  detalle: string;
  cantidad: number;
  precio: number;
  total: number;
}

export function VistaIngresos({ filas }: { filas: FilaIngreso[] }) {
  const router = useRouter();
  const columnas = useMemo<ColumnDef<FilaIngreso, unknown>[]>(
    () => [
      {
        id: "fecha",
        header: "Fecha",
        accessorKey: "fechaOrden",
        cell: ({ row }) => row.original.fecha,
      },
      {
        id: "concepto",
        header: "Concepto",
        accessorFn: (f) => `${f.concepto} ${f.detalle}`,
        cell: ({ row: { original: f } }) => (
          <div className="flex flex-col">
            <span className="font-semibold">{f.concepto}</span>
            <span className="text-muted-foreground text-xs">
              {[f.tipo, f.detalle].filter(Boolean).join(" · ")}
            </span>
          </div>
        ),
      },
      {
        id: "cantidad",
        header: "Cantidad × valor",
        accessorKey: "cantidad",
        cell: ({ row: { original: f } }) =>
          `${formatoNumero(f.cantidad, 3)} × ${formatoCOP(f.precio)}`,
        meta: {
          ocultarEnMovil: true,
          claseCelda: "text-right tabular-nums",
          claseCabecera: "text-right",
        },
      },
      {
        id: "total",
        header: "Total",
        accessorKey: "total",
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
      placeholderBusqueda="Buscar concepto o comprador…"
      vacio="No hay ingresos en este mes."
      alClicFila={(f) => router.push(`/costos/ingresos/${f.id}`)}
    />
  );
}
