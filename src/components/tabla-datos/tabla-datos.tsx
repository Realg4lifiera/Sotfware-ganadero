"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Quita tildes y pasa a minúsculas para buscar "maria" y encontrar "María". */
export function normalizarBusqueda(texto: unknown): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function TablaDatos<T>({
  columnas,
  datos,
  buscador = true,
  placeholderBusqueda = "Buscar…",
  tamanoPagina = 25,
  vacio = "No hay registros.",
  alClicFila,
  claseFila,
  barra,
}: {
  columnas: ColumnDef<T, unknown>[];
  datos: T[];
  buscador?: boolean;
  placeholderBusqueda?: string;
  tamanoPagina?: number;
  vacio?: React.ReactNode;
  alClicFila?: (fila: T) => void;
  claseFila?: (fila: T) => string | undefined;
  /** Controles extra junto al buscador (filtros, botones). */
  barra?: React.ReactNode;
}) {
  const [orden, setOrden] = useState<SortingState>([]);
  const [busqueda, setBusqueda] = useState("");

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 con React Compiler
  const tabla = useReactTable({
    data: datos,
    columns: columnas,
    state: { sorting: orden, globalFilter: busqueda },
    onSortingChange: setOrden,
    onGlobalFilterChange: setBusqueda,
    globalFilterFn: (fila, columnaId, filtro) =>
      normalizarBusqueda(fila.getValue(columnaId)).includes(normalizarBusqueda(filtro)),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: tamanoPagina } },
  });

  const filas = tabla.getRowModel().rows;
  const total = tabla.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = tabla.getState().pagination;

  return (
    <div className="flex flex-col gap-3">
      {(buscador || barra) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {buscador && (
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={placeholderBusqueda}
                className="pl-9"
                type="search"
              />
            </div>
          )}
          {barra}
        </div>
      )}

      <div className="bg-card overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            {tabla.getHeaderGroups().map((g) => (
              <TableRow key={g.id}>
                {g.headers.map((h) => {
                  const ordenable = h.column.getCanSort();
                  const dir = h.column.getIsSorted();
                  return (
                    <TableHead
                      key={h.id}
                      className={cn(
                        h.column.columnDef.meta?.claseCabecera,
                        h.column.columnDef.meta?.ocultarEnMovil && "hidden md:table-cell",
                      )}
                    >
                      {h.isPlaceholder ? null : ordenable ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className="hover:text-foreground inline-flex items-center gap-1 uppercase"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === "asc" && <ArrowUp className="size-3" />}
                          {dir === "desc" && <ArrowDown className="size-3" />}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnas.length}
                  className="text-muted-foreground py-10 text-center"
                >
                  {vacio}
                </TableCell>
              </TableRow>
            ) : (
              filas.map((f) => (
                <TableRow
                  key={f.id}
                  onClick={alClicFila ? () => alClicFila(f.original) : undefined}
                  className={cn(alClicFila && "cursor-pointer", claseFila?.(f.original))}
                >
                  {f.getVisibleCells().map((c) => (
                    <TableCell
                      key={c.id}
                      className={cn(
                        c.column.columnDef.meta?.claseCelda,
                        c.column.columnDef.meta?.ocultarEnMovil && "hidden md:table-cell",
                      )}
                    >
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
        <span>
          {total === 0
            ? "0 registros"
            : `${pageIndex * pageSize + 1}–${Math.min(total, (pageIndex + 1) * pageSize)} de ${total}`}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => tabla.previousPage()}
            disabled={!tabla.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => tabla.nextPage()}
            disabled={!tabla.getCanNextPage()}
            aria-label="Página siguiente"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
