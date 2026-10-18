import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_TIPO_EVENTO_SANITARIO } from "@/lib/etiquetas";
import { formatoFecha, mesDesdeParametro, nombreMes, rangoMes } from "@/lib/fechas";
import { formatoNumero } from "@/lib/formato";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { retirosVigentes } from "@/lib/servicios/sanidad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";
import { SelectorMes } from "@/components/selector-mes";
import { TarjetaResumen } from "@/components/tarjeta-resumen";
import { eliminarEventoSanitario } from "./acciones";

export const metadata: Metadata = { title: "Sanidad" };

export default async function PaginaSanidad({ searchParams }: PageProps<"/produccion/sanidad">) {
  const usuario = await requierePermiso("sanidad:leer");
  const mes = mesDesdeParametro((await searchParams).mes);
  const { desde, hasta } = rangoMes(mes);
  const [eventos, retiros] = await Promise.all([
    prismaBase.eventoSanitario.findMany({
      where: { deletedAt: null, fecha: { gte: desde, lt: hasta } },
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      include: {
        animal: { select: { numero: true, nombre: true } },
        lote: { select: { nombre: true } },
      },
    }),
    retirosVigentes(),
  ]);
  const registra = puede(usuario.rol, "sanidad:registrar");
  const leche = retiros.filter((r) => r.lecheHasta && r.enProduccion);
  return (
    <>
      <EncabezadoPagina
        titulo="Sanidad"
        descripcion={`Vacunas, desparasitaciones y tratamientos · ${nombreMes(mes)}`}
        volver={{ href: "/produccion", texto: "Producción" }}
        acciones={
          registra && (
            <Button asChild>
              <Link href="/produccion/sanidad/nuevo">
                <Plus /> Registrar evento
              </Link>
            </Button>
          )
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 [&>*]:min-w-0">
        <TarjetaResumen
          titulo="En retiro de leche"
          valor={formatoNumero(leche.length)}
          detalle="Vacas en producción"
        />
        <TarjetaResumen
          titulo="En retiro de carne"
          valor={formatoNumero(retiros.filter((r) => r.carneHasta).length)}
          detalle="No enviar a sacrificio"
        />
      </div>
      {retiros.length > 0 && (
        <Card id="retiros" className="mb-5 scroll-mt-20">
          <CardHeader>
            <CardTitle>Animales en retiro hoy</CardTitle>
            <CardDescription>
              Su leche se registra como consumo interno (retiro), no como venta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {retiros.map((r) => (
                <li
                  key={r.animalId}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <Link
                    href={`/animales/${r.animalId}?pestana=sanidad`}
                    className="font-medium hover:underline"
                  >
                    {r.animal}
                    <span className="text-muted-foreground block text-xs font-normal">
                      {r.productos.join(", ")}
                    </span>
                  </Link>
                  <span className="flex flex-wrap gap-1">
                    {r.lecheHasta && r.enProduccion && (
                      <Badge variant="accent">Leche hasta {formatoFecha(r.lecheHasta)}</Badge>
                    )}
                    {r.carneHasta && (
                      <Badge variant="outline">Carne hasta {formatoFecha(r.carneHasta)}</Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <SelectorMes mes={mes} ruta="/produccion/sanidad" />
      {eventos.length === 0 ? (
        <EstadoVacio titulo="No hay eventos sanitarios en este mes." />
      ) : (
        <ul className="bg-card divide-y overflow-hidden rounded-xl border">
          {eventos.map((e) => {
            const a = e.animal
              ? `${e.animal.numero}${e.animal.nombre ? ` · ${e.animal.nombre}` : ""}`
              : e.lote?.nombre;
            return (
              <li key={e.id} className="flex items-center gap-2 px-4 py-3">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">
                    {ETIQUETA_TIPO_EVENTO_SANITARIO[e.tipo]}: {e.producto}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {[
                      formatoFecha(e.fecha),
                      a,
                      e.dosis,
                      e.retiroLecheHasta && `leche hasta ${formatoFecha(e.retiroLecheHasta)}`,
                      e.retiroCarneHasta && `carne hasta ${formatoFecha(e.retiroCarneHasta)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                {registra && (
                  <BotonEliminar
                    accion={eliminarEventoSanitario.bind(null, e.id)}
                    titulo="¿Eliminar este evento?"
                    descripcion={`${e.producto} · ${a} · ${formatoFecha(e.fecha)}`}
                    destino="/produccion/sanidad"
                    compacto
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
