"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { FilterX, Search } from "lucide-react";
import { CATEGORIAS, ETIQUETA_CATEGORIA, type CategoriaAnimal } from "@/lib/dominio/categoria";
import { ETIQUETA_ESTADO_ANIMAL } from "@/lib/etiquetas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { normalizarBusqueda, TablaDatos } from "@/components/tabla-datos/tabla-datos";
import { FotoAnimal } from "./foto-animal";

export interface FilaAnimal {
  id: string;
  numero: string;
  nombre: string;
  sexo: string;
  sexoEtiqueta: string;
  categoria: CategoriaAnimal;
  categoriaEtiqueta: string;
  raza: string;
  edad: string;
  edadMeses: number;
  loteId: string;
  lote: string;
  potreroId: string;
  potrero: string;
  estado: string;
  estadoEtiqueta: string;
  estadoReproductivo: string;
  tieneFoto: boolean;
  fotoUrl: string | null;
}

export interface FiltrosAnimales {
  q: string;
  lote: string;
  potrero: string;
  sexo: string;
  categoria: string;
  estado: string;
}

const VACIOS: FiltrosAnimales = {
  q: "",
  lote: "",
  potrero: "",
  sexo: "",
  categoria: "",
  estado: "ACTIVO",
};

export function VistaAnimales({
  filas,
  filtrosIniciales,
}: {
  filas: FilaAnimal[];
  filtrosIniciales: FiltrosAnimales;
}) {
  const router = useRouter();
  const [f, setF] = useState(filtrosIniciales);

  const cambiar = (k: keyof FiltrosAnimales, v: string) => {
    const nuevos = { ...f, [k]: v };
    setF(nuevos);
    // Mantiene los filtros en la URL (se pueden compartir y sobreviven al "atrás").
    const q = new URLSearchParams(
      Object.entries(nuevos).filter(
        ([clave, valor]) => valor && !(clave === "estado" && valor === "ACTIVO"),
      ),
    );
    window.history.replaceState(null, "", q.size ? `/animales?${q}` : "/animales");
  };

  const lotes = useMemo(() => unicos(filas.map((a) => [a.loteId, a.lote])), [filas]);
  const potreros = useMemo(() => unicos(filas.map((a) => [a.potreroId, a.potrero])), [filas]);

  const filtradas = useMemo(() => {
    const q = normalizarBusqueda(f.q.trim());
    return filas.filter(
      (a) =>
        (!q ||
          normalizarBusqueda(a.numero).includes(q) ||
          normalizarBusqueda(a.nombre).includes(q)) &&
        (!f.lote || (f.lote === "-" ? !a.loteId : a.loteId === f.lote)) &&
        (!f.potrero || (f.potrero === "-" ? !a.potreroId : a.potreroId === f.potrero)) &&
        (!f.sexo || a.sexo === f.sexo) &&
        (!f.categoria || a.categoria === f.categoria) &&
        (!f.estado || f.estado === "TODOS" || a.estado === f.estado),
    );
  }, [filas, f]);

  const columnas = useMemo<ColumnDef<FilaAnimal, unknown>[]>(
    () => [
      {
        id: "numero",
        header: "Animal",
        accessorFn: (a) => a.numero.padStart(10, "0"),
        cell: ({ row: { original: a } }) => (
          <div className="flex items-center gap-3">
            <FotoAnimal url={a.fotoUrl} sexo={a.sexo} className="size-10" />
            <div className="flex min-w-0 flex-col">
              <span className="font-semibold">{a.numero}</span>
              <span className="text-muted-foreground truncate text-xs">
                {a.nombre || "Sin nombre"}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "categoria",
        header: "Categoría",
        accessorKey: "categoriaEtiqueta",
        cell: ({ row: { original: a } }) => (
          <div className="flex flex-col gap-0.5">
            <span>{a.categoriaEtiqueta}</span>
            {a.estadoReproductivo && (
              <span className="text-muted-foreground text-xs">{a.estadoReproductivo}</span>
            )}
          </div>
        ),
      },
      { id: "sexo", header: "Sexo", accessorKey: "sexoEtiqueta", meta: { ocultarEnMovil: true } },
      { id: "raza", header: "Raza", accessorKey: "raza", meta: { ocultarEnMovil: true } },
      {
        id: "edad",
        header: "Edad",
        accessorKey: "edadMeses",
        cell: ({ row: { original: a } }) => a.edad || "—",
        meta: { ocultarEnMovil: true },
      },
      {
        id: "lote",
        header: "Lote",
        accessorKey: "lote",
        cell: ({ row: { original: a } }) => (
          <div className="flex flex-col gap-0.5">
            <span>{a.lote || "—"}</span>
            <span className="text-muted-foreground text-xs md:hidden">{a.potrero}</span>
          </div>
        ),
      },
      { id: "potrero", header: "Potrero", accessorKey: "potrero", meta: { ocultarEnMovil: true } },
      {
        id: "estado",
        header: "Estado",
        accessorKey: "estadoEtiqueta",
        meta: { ocultarEnMovil: true },
        cell: ({ row: { original: a } }) =>
          a.estado === "ACTIVO" ? (
            <Badge variant="secondary">Activo</Badge>
          ) : (
            <Badge variant="outline">{a.estadoEtiqueta}</Badge>
          ),
      },
    ],
    [],
  );

  const hayFiltros = JSON.stringify(f) !== JSON.stringify(VACIOS);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={f.q}
          onChange={(e) => cambiar("q", e.target.value)}
          placeholder="Buscar por número o nombre…"
          className="h-11 pl-9"
          aria-label="Buscar por número o nombre"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <NativeSelect
          value={f.categoria}
          onChange={(e) => cambiar("categoria", e.target.value)}
          aria-label="Categoría"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {ETIQUETA_CATEGORIA[c]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={f.lote}
          onChange={(e) => cambiar("lote", e.target.value)}
          aria-label="Lote"
        >
          <option value="">Todos los lotes</option>
          {lotes.map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
          <option value="-">Sin lote</option>
        </NativeSelect>
        <NativeSelect
          value={f.potrero}
          onChange={(e) => cambiar("potrero", e.target.value)}
          aria-label="Potrero"
        >
          <option value="">Todos los potreros</option>
          {potreros.map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
          <option value="-">Sin potrero</option>
        </NativeSelect>
        <NativeSelect
          value={f.sexo}
          onChange={(e) => cambiar("sexo", e.target.value)}
          aria-label="Sexo"
        >
          <option value="">Hembras y machos</option>
          <option value="HEMBRA">Hembras</option>
          <option value="MACHO">Machos</option>
        </NativeSelect>
        <NativeSelect
          value={f.estado}
          onChange={(e) => cambiar("estado", e.target.value)}
          aria-label="Estado"
        >
          {Object.entries(ETIQUETA_ESTADO_ANIMAL).map(([v, e]) => (
            <option key={v} value={v}>
              {v === "ACTIVO" ? "Activos" : e === "Muerto" ? "Muertos" : `${e}s`}
            </option>
          ))}
          <option value="TODOS">Todos los estados</option>
        </NativeSelect>
      </div>
      {hayFiltros && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            setF(VACIOS);
            window.history.replaceState(null, "", "/animales");
          }}
        >
          <FilterX /> Quitar filtros
        </Button>
      )}
      <TablaDatos
        columnas={columnas}
        datos={filtradas}
        buscador={false}
        tamanoPagina={50}
        vacio="No hay animales con esos filtros."
        alClicFila={(a) => router.push(`/animales/${a.id}`)}
      />
    </div>
  );
}

function unicos(pares: string[][]): string[][] {
  const mapa = new Map<string, string>();
  for (const [id, nombre] of pares) if (id) mapa.set(id, nombre);
  return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
}
