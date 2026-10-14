"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { formatoCOP } from "@/lib/formato";
import { Badge } from "@/components/ui/badge";
import { TablaDatos } from "@/components/tabla-datos/tabla-datos";

export interface FilaActivo {
  id: string;
  nombre: string;
  centro: string;
  fechaCompra: string;
  valorCompra: number;
  vidaUtil: string;
  cuotaMes: number;
  acumulada: number;
  valorEnLibros: number;
  enUso: boolean;
}

const pesos = (ocultarEnMovil = true) => ({
  ocultarEnMovil,
  claseCelda: "text-right tabular-nums",
  claseCabecera: "text-right",
});

export function VistaActivos({ filas }: { filas: FilaActivo[] }) {
  const router = useRouter();
  const columnas = useMemo<ColumnDef<FilaActivo, unknown>[]>(
    () => [
      {
        id: "nombre",
        header: "Activo",
        accessorKey: "nombre",
        cell: ({ row: { original: f } }) => (
          <div className="flex flex-col">
            <span className="flex items-center gap-2 font-semibold">
              {f.nombre} {!f.enUso && <Badge variant="outline">Fuera de uso</Badge>}
            </span>
            <span className="text-muted-foreground text-xs">
              {f.centro} · desde {f.fechaCompra} · {f.vidaUtil}
            </span>
          </div>
        ),
      },
      {
        id: "valorCompra",
        header: "Valor de compra",
        accessorKey: "valorCompra",
        cell: ({ getValue }) => formatoCOP(getValue() as number),
        meta: pesos(),
      },
      {
        id: "acumulada",
        header: "Acumulada",
        accessorKey: "acumulada",
        cell: ({ getValue }) => formatoCOP(getValue() as number),
        meta: pesos(),
      },
      {
        id: "valorEnLibros",
        header: "En libros",
        accessorKey: "valorEnLibros",
        cell: ({ getValue }) => formatoCOP(getValue() as number),
        meta: pesos(),
      },
      {
        id: "cuotaMes",
        header: "Este mes",
        accessorKey: "cuotaMes",
        cell: ({ getValue }) => (
          <span className="font-semibold">{formatoCOP(getValue() as number)}</span>
        ),
        meta: pesos(false),
      },
    ],
    [],
  );
  return (
    <TablaDatos
      columnas={columnas}
      datos={filas}
      placeholderBusqueda="Buscar activo…"
      vacio="No hay activos registrados."
      alClicFila={(f) => router.push(`/costos/activos/${f.id}`)}
    />
  );
}
