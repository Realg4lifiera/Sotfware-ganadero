"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Paperclip } from "lucide-react";
import { formatoCOP } from "@/lib/formato";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { TablaDatos } from "@/components/tabla-datos/tabla-datos";

export interface FilaGasto {
  id: string;
  fecha: string;
  fechaOrden: string;
  descripcion: string;
  proveedor: string;
  categoria: string;
  rubro: string;
  centro: string;
  asignacion: string;
  origen: string;
  total: number;
  iva: number;
  costo: number;
  soportes: number;
}

function Resumen({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs font-semibold">{titulo}</p>
        <p className="font-display text-2xl font-semibold tabular-nums">{valor}</p>
        {detalle && <p className="text-muted-foreground text-xs">{detalle}</p>}
      </CardContent>
    </Card>
  );
}

export function VistaGastos({ filas, ivaEsCosto }: { filas: FilaGasto[]; ivaEsCosto: boolean }) {
  const router = useRouter();
  const [rubro, setRubro] = useState("");
  const rubros = useMemo(
    () => [...new Set(filas.map((f) => f.rubro))].sort((a, b) => a.localeCompare(b, "es")),
    [filas],
  );
  const visibles = rubro ? filas.filter((f) => f.rubro === rubro) : filas;
  const suma = (k: "total" | "iva" | "costo") => visibles.reduce((s, f) => s + f[k], 0);

  const columnas = useMemo<ColumnDef<FilaGasto, unknown>[]>(
    () => [
      {
        id: "fecha",
        header: "Fecha",
        accessorKey: "fechaOrden",
        cell: ({ row }) => row.original.fecha,
      },
      {
        id: "descripcion",
        header: "Artículo",
        accessorFn: (f) => `${f.descripcion} ${f.proveedor}`,
        cell: ({ row: { original: f } }) => (
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 font-semibold">
              {f.descripcion}
              {f.soportes > 0 && (
                <Paperclip className="text-muted-foreground size-3.5" aria-label="Con soporte" />
              )}
            </span>
            <span className="text-muted-foreground text-xs">
              {[f.proveedor, f.asignacion].filter(Boolean).join(" · ") || f.origen}
            </span>
          </div>
        ),
      },
      {
        id: "categoria",
        header: "Categoría",
        accessorKey: "categoria",
        meta: { ocultarEnMovil: true },
        cell: ({ row: { original: f } }) => (
          <div className="flex flex-col">
            <span>{f.categoria}</span>
            <span className="text-muted-foreground text-xs">{f.rubro}</span>
          </div>
        ),
      },
      { id: "centro", header: "Centro", accessorKey: "centro", meta: { ocultarEnMovil: true } },
      {
        id: "iva",
        header: "IVA",
        accessorKey: "iva",
        cell: ({ getValue }) => formatoCOP(getValue() as number),
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 [&>*]:min-w-0">
        <Resumen
          titulo="Total pagado"
          valor={formatoCOP(suma("total"))}
          detalle={`${visibles.length} registros`}
        />
        <Resumen titulo="IVA" valor={formatoCOP(suma("iva"))} />
        <Resumen
          titulo="Costo del mes"
          valor={formatoCOP(suma("costo"))}
          detalle={ivaEsCosto ? "Incluye el IVA" : "Sin IVA (se recupera)"}
        />
      </div>
      <TablaDatos
        columnas={columnas}
        datos={visibles}
        placeholderBusqueda="Buscar artículo o proveedor…"
        vacio="No hay gastos en este mes."
        alClicFila={(f) => router.push(`/costos/gastos/${f.id}`)}
        barra={
          rubros.length > 1 && (
            <NativeSelect
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
              aria-label="Rubro"
              className="sm:w-64"
            >
              <option value="">Todos los rubros</option>
              {rubros.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          )
        }
      />
    </div>
  );
}
