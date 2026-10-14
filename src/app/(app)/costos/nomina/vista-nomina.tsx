"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { formatoCOP } from "@/lib/formato";
import { TablaDatos } from "@/components/tabla-datos/tabla-datos";

export interface FilaPago {
  id: string;
  fecha: string;
  fechaOrden: string;
  trabajador: string;
  contrato: string;
  salarioBase: number;
  centro: string;
  total: number;
}

export function VistaNomina({ filas }: { filas: FilaPago[] }) {
  const router = useRouter();
  const columnas = useMemo<ColumnDef<FilaPago, unknown>[]>(
    () => [
      {
        id: "trabajador",
        header: "Trabajador",
        accessorKey: "trabajador",
        cell: ({ row: { original: f } }) => (
          <div className="flex flex-col">
            <span className="font-semibold">{f.trabajador}</span>
            <span className="text-muted-foreground text-xs">{f.contrato}</span>
          </div>
        ),
      },
      {
        id: "fecha",
        header: "Fecha de pago",
        accessorKey: "fechaOrden",
        cell: ({ row }) => row.original.fecha,
      },
      {
        id: "salarioBase",
        header: "Salario base",
        accessorKey: "salarioBase",
        cell: ({ getValue }) => formatoCOP(getValue() as number),
        meta: {
          ocultarEnMovil: true,
          claseCelda: "text-right tabular-nums",
          claseCabecera: "text-right",
        },
      },
      { id: "centro", header: "Centro", accessorKey: "centro", meta: { ocultarEnMovil: true } },
      {
        id: "total",
        header: "Costo total",
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
      placeholderBusqueda="Buscar trabajador…"
      vacio="No hay pagos en este mes."
      alClicFila={(f) => router.push(`/costos/nomina/${f.id}`)}
    />
  );
}
