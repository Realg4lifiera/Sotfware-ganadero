import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";
import { formatoFecha } from "@/lib/fechas";
import { formatoNumero } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { estadoPotreros } from "@/lib/servicios/rotacion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { TarjetaResumen } from "@/components/tarjeta-resumen";

export const metadata: Metadata = { title: "Potreros y rotación" };

const n = (x: number | null, d = 2) => (x == null ? "—" : formatoNumero(x, d));

export default async function PaginaRotacion() {
  const usuario = await requierePermiso("produccion:leer");
  const e = await estadoPotreros();
  const registra = puede(usuario.rol, "produccion:registrar");
  return (
    <>
      <EncabezadoPagina
        titulo="Potreros y rotación"
        descripcion="Ocupación, descanso y carga animal de cada potrero."
        volver={{ href: "/produccion", texto: "Producción" }}
        acciones={
          registra && (
            <Button asChild>
              <Link href="/produccion/rotacion/nuevo">
                <ArrowRightLeft /> Rotar lote
              </Link>
            </Button>
          )
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="Carga animal"
          valor={`${n(e.cargaUggHa)} UGG/ha`}
          detalle={`${n(e.totalUgg, 1)} UGG en ${n(e.areaHa, 1)} ha`}
        />
        <TarjetaResumen
          titulo="Potreros ocupados"
          valor={`${e.potreros.filter((p) => p.lotes.length).length} de ${e.potreros.length}`}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        {e.potreros.map((p) => (
          <Card key={p.id} className={p.activo ? "" : "opacity-60"}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                {p.nombre}
                {p.lotes.length ? (
                  <Badge variant="accent">Ocupado</Badge>
                ) : (
                  <Badge variant="secondary">En descanso</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {[p.areaHa && `${n(p.areaHa, 2)} ha`, p.tipoPasto].filter(Boolean).join(" · ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {p.lotes.map((l) => (
                <p key={l.nombre}>
                  <span className="font-semibold">{l.nombre}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · desde {formatoFecha(l.desde)} ({l.dias} días)
                  </span>
                </p>
              ))}
              {p.descansoDias != null && (
                <p className="text-muted-foreground">{p.descansoDias} días de descanso</p>
              )}
              <dl className="grid grid-cols-3 gap-2 border-t pt-2">
                <div>
                  <dt className="text-muted-foreground text-xs">Animales</dt>
                  <dd className="font-semibold tabular-nums">{p.animales}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">UGG</dt>
                  <dd className="font-semibold tabular-nums">{n(p.ugg, 1)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">UGG/ha</dt>
                  <dd className="font-semibold tabular-nums">{n(p.cargaUggHa)}</dd>
                </div>
              </dl>
              {registra && !p.lotes.length && p.activo && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/produccion/rotacion/nuevo?potrero=${p.id}`}>Entrar un lote</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Últimas ocupaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {e.historial.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block font-medium">
                    {h.lote} → {h.potrero}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatoFecha(h.entrada)} a {h.salida ? formatoFecha(h.salida) : "hoy"}
                  </span>
                </span>
                <span className="tabular-nums">{h.dias} días</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <p className="text-muted-foreground mt-3 text-xs">
        1 UGG = peso vivo de referencia (450 kg por defecto). Cada animal cuenta con su último
        pesaje o, sin pesajes, con el peso estimado de su categoría (Configuración › Finca). La
        carga global usa el área útil de la finca (o la suma de los potreros si no está
        configurada).
      </p>
    </>
  );
}
