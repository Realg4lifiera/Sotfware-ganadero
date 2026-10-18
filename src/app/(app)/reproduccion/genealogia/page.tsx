import type { Metadata } from "next";
import Link from "next/link";
import { prismaBase } from "@/lib/db";
import { formatoNumero } from "@/lib/formato";
import { requierePermiso } from "@/lib/sesion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";

export const metadata: Metadata = { title: "Genealogía" };

/**
 * Descendencia por toro. El árbol de padres y abuelos de cada animal está en su hoja de
 * vida (pestaña Genealogía); la alerta de consanguinidad aparece al registrar un servicio.
 */
export default async function PaginaGenealogia() {
  await requierePermiso("reproduccion:leer");
  const toros = await prismaBase.toro.findMany({
    where: { deletedAt: null },
    orderBy: { nombre: "asc" },
    include: {
      raza: { select: { nombre: true } },
      hijos: {
        where: { deletedAt: null },
        orderBy: { fechaNacimiento: "desc" },
        select: { id: true, numero: true, nombre: true, sexo: true, estado: true },
      },
    },
  });
  const conCrias = toros.filter((t) => t.hijos.length > 0);
  return (
    <>
      <EncabezadoPagina
        titulo="Genealogía"
        descripcion="Descendencia registrada de cada toro. El árbol de cada animal está en su hoja de vida."
        volver={{ href: "/reproduccion", texto: "Reproducción" }}
      />
      {conCrias.length === 0 ? (
        <EstadoVacio titulo="Aún no hay crías con padre registrado." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {conCrias.map((t) => {
            const hijas = t.hijos.filter((h) => h.sexo === "HEMBRA");
            return (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle>{t.codigo ? `${t.nombre} (${t.codigo})` : t.nombre}</CardTitle>
                  <CardDescription>
                    {[t.raza?.nombre, t.propio ? "Propio" : "Pajilla"].filter(Boolean).join(" · ")}{" "}
                    · {formatoNumero(hijas.length)} hijas ·{" "}
                    {formatoNumero(t.hijos.length - hijas.length)} hijos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-2">
                    {t.hijos.map((h) => (
                      <li key={h.id}>
                        <Link href={`/animales/${h.id}?pestana=genealogia`}>
                          <Badge
                            variant={h.sexo === "HEMBRA" ? "accent" : "outline"}
                            className={h.estado === "ACTIVO" ? "" : "opacity-60"}
                          >
                            {h.numero}
                            {h.nombre ? ` · ${h.nombre}` : ""}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
