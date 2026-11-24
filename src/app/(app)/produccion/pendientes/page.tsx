import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Milk, Scale } from "lucide-react";
import {
  TITULO_AVISO_PRODUCTIVO,
  type TipoAvisoProductivo,
} from "@/lib/dominio/alertas-productivas";
import { ETIQUETA_CATEGORIA, CATEGORIAS } from "@/lib/dominio/categoria";
import { formatoNumero } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { avisosDelHato } from "@/lib/servicios/avisos-productivos";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";

export const metadata: Metadata = { title: "Pendientes de producción" };

const ORDEN: TipoAvisoProductivo[] = ["PESAJE_PENDIENTE", "CONTROL_LECHERO"];

export default async function PaginaPendientes() {
  const usuario = await requierePermiso("produccion:leer");
  const registrar = puede(usuario.rol, "produccion:registrar");
  const [avisos, config] = await Promise.all([avisosDelHato(), obtenerConfiguracionFinca()]);
  const c = config.produccion;
  const frecuencias = CATEGORIAS.filter((cat) => c.diasPesaje[cat] > 0)
    .map((cat) => `${ETIQUETA_CATEGORIA[cat].toLowerCase()} cada ${c.diasPesaje[cat]}`)
    .join(", ");
  const descripcion: Record<TipoAvisoProductivo, string> = {
    PESAJE_PENDIENTE: frecuencias
      ? `Animales sin pesar a tiempo (${frecuencias} días). Sin pesajes, cuenta desde su ingreso.`
      : "Ninguna categoría tiene frecuencia de pesaje configurada.",
    CONTROL_LECHERO: `Vacas en producción con ${c.diasControlLechero} días o más sin control lechero (por vaca o por su lote).`,
  };
  // Se pesa y se ordeña por lote: la lista va agrupada por lote, con su acción.
  const accion = (tipo: TipoAvisoProductivo, loteId: string | null) =>
    tipo === "PESAJE_PENDIENTE"
      ? {
          href: loteId ? `/produccion/pesajes/lote?lote=${loteId}` : "/produccion/pesajes/nuevo",
          texto: loteId ? "Pesar lote" : "Pesar",
        }
      : { href: "/produccion/ordenos/control", texto: "Registrar control" };
  return (
    <>
      <EncabezadoPagina
        titulo="Pendientes de producción"
        descripcion="Los días se ajustan en Configuración › Finca › Producción."
        volver={{ href: "/produccion", texto: "Producción" }}
      />
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        {ORDEN.map((tipo) => {
          const lista = avisos.filter((a) => a.tipo === tipo);
          const grupos = new Map<
            string,
            { loteId: string | null; lote: string; avisos: typeof lista }
          >();
          for (const a of lista) {
            const clave = a.loteId ?? "-";
            const g = grupos.get(clave) ?? {
              loteId: a.loteId,
              lote: a.lote ?? "Sin lote",
              avisos: [],
            };
            g.avisos.push(a);
            grupos.set(clave, g);
          }
          const Icono = tipo === "PESAJE_PENDIENTE" ? Scale : Milk;
          return (
            <Card key={tipo} id={tipo.toLowerCase()} className="scroll-mt-20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Icono className="text-muted-foreground size-5" />
                    {TITULO_AVISO_PRODUCTIVO[tipo]}
                  </span>
                  <Badge variant={lista.length ? "accent" : "secondary"}>
                    {formatoNumero(lista.length)}
                  </Badge>
                </CardTitle>
                <CardDescription>{descripcion[tipo]}</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {lista.length === 0 ? (
                  <p className="text-muted-foreground px-6 text-sm">Todo al día.</p>
                ) : (
                  <div className="border-t">
                    {[...grupos.values()].map((g) => (
                      <section key={g.loteId ?? "-"} aria-label={g.lote}>
                        <div className="bg-muted/50 flex items-center justify-between gap-2 px-6 py-2">
                          <span className="text-sm font-semibold">
                            {g.lote}{" "}
                            <span className="text-muted-foreground font-normal">
                              · {formatoNumero(g.avisos.length)}
                            </span>
                          </span>
                          {registrar && (
                            <Button asChild variant="outline" size="sm">
                              <Link href={accion(tipo, g.loteId).href}>
                                {accion(tipo, g.loteId).texto}
                              </Link>
                            </Button>
                          )}
                        </div>
                        <ul className="divide-y">
                          {g.avisos.map((a) => (
                            <li key={a.animalId}>
                              <Link
                                href={`/animales/${a.animalId}`}
                                className="hover:bg-muted/40 flex items-center gap-3 px-6 py-2.5"
                              >
                                <span className="flex min-w-0 flex-1 flex-col">
                                  <span className="font-semibold">{a.animal}</span>
                                  <span className="text-muted-foreground truncate text-xs">
                                    {a.detalle}
                                  </span>
                                </span>
                                <ChevronRight className="text-muted-foreground size-4" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
