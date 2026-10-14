import type { Metadata } from "next";
import Link from "next/link";
import { prismaBase } from "@/lib/db";
import { formatoFechaHora } from "@/lib/fechas";
import { requierePermiso } from "@/lib/sesion";
import type { Prisma } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";

export const metadata: Metadata = { title: "Auditoría" };

const POR_PAGINA = 50;
const VARIANTE = { CREAR: "secondary", EDITAR: "accent", ELIMINAR: "destructive" } as const;
const ACCION = { CREAR: "Creó", EDITAR: "Editó", ELIMINAR: "Eliminó" } as const;

function Valor({ v }: { v: unknown }) {
  if (v === null || v === undefined) return <span className="text-muted-foreground">vacío</span>;
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return <span className="break-all">{s.length > 80 ? `${s.slice(0, 80)}…` : s}</span>;
}

export default async function PaginaAuditoria({ searchParams }: PageProps<"/auditoria">) {
  await requierePermiso("auditoria:leer");
  const sp = await searchParams;
  const entidad = typeof sp.entidad === "string" ? sp.entidad : "";
  const entidadId = typeof sp.id === "string" ? sp.id : "";
  const usuarioId = typeof sp.usuario === "string" ? sp.usuario : "";
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  const where: Prisma.AuditoriaWhereInput = {
    ...(entidad && { entidad }),
    ...(entidadId && { entidadId }),
    ...(usuarioId && { usuarioId }),
  };
  const [registros, total, entidades, usuarios] = await Promise.all([
    prismaBase.auditoria.findMany({
      where,
      orderBy: { fecha: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prismaBase.auditoria.count({ where }),
    prismaBase.auditoria.findMany({
      distinct: ["entidad"],
      select: { entidad: true },
      orderBy: { entidad: "asc" },
    }),
    prismaBase.usuario.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
  ]);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const enlace = (p: number) => {
    const q = new URLSearchParams({
      ...(entidad && { entidad }),
      ...(entidadId && { id: entidadId }),
      ...(usuarioId && { usuario: usuarioId }),
      pagina: String(p),
    });
    return `/auditoria?${q}`;
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Auditoría"
        descripcion="Cada creación, edición y eliminación: quién, cuándo y qué cambió."
      />
      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <NativeSelect name="entidad" defaultValue={entidad} aria-label="Entidad">
          <option value="">Todas las entidades</option>
          {entidades.map((e) => (
            <option key={e.entidad} value={e.entidad}>
              {e.entidad}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="usuario" defaultValue={usuarioId} aria-label="Usuario">
          <option value="">Todos los usuarios</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </NativeSelect>
        <Input
          name="id"
          defaultValue={entidadId}
          placeholder="Id del registro"
          aria-label="Id del registro"
        />
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {registros.length === 0 ? (
        <EstadoVacio
          titulo="Sin registros de auditoría"
          descripcion="Los cambios aparecerán aquí."
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {registros.map((r) => {
            const antes = (r.antes ?? {}) as Record<string, unknown>;
            const despues = (r.despues ?? {}) as Record<string, unknown>;
            const campos = r.accion === "CREAR" ? [] : Object.keys({ ...antes, ...despues });
            return (
              <li key={r.id} className="bg-card rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={VARIANTE[r.accion]}>{ACCION[r.accion]}</Badge>
                  <Link
                    href={`/auditoria?entidad=${r.entidad}&id=${r.entidadId}`}
                    className="font-semibold hover:underline"
                  >
                    {r.entidad}
                  </Link>
                  <span className="text-muted-foreground">
                    {r.usuarioNombre ?? "Sistema"} · {formatoFechaHora(r.fecha)}
                  </span>
                </div>
                {r.accion === "CREAR" && despues && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {["numero", "nombre", "descripcion", "concepto"]
                      .filter((k) => despues[k])
                      .map((k) => String(despues[k]))
                      .join(" · ") || r.entidadId}
                  </p>
                )}
                {campos.length > 0 && (
                  <ul className="mt-2 grid gap-1 text-xs">
                    {campos.map((c) => (
                      <li key={c} className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-2">
                        <span className="text-muted-foreground font-medium">{c}</span>
                        <span>
                          <Valor v={antes[c]} /> → <Valor v={despues[c]} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {paginas > 1 && (
        <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
          <span>
            Página {pagina} de {paginas} · {total} registros
          </span>
          <div className="flex gap-2">
            {pagina > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={enlace(pagina - 1)}>Anterior</Link>
              </Button>
            )}
            {pagina < paginas && (
              <Button asChild variant="outline" size="sm">
                <Link href={enlace(pagina + 1)}>Siguiente</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
