import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowRight, Beef, Droplets, Milk, Wallet } from "lucide-react";
import { fincasAccesibles } from "@/lib/finca-sesion";
import { nombreMes, mesActualISO } from "@/lib/fechas";
import { formatoCOP, formatoLitros, formatoNumero, formatoPorcentaje } from "@/lib/formato";
import { requiereSesion } from "@/lib/sesion";
import { resumenFincas } from "@/lib/servicios/resumen-fincas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { EstadoVacio } from "@/components/estado-vacio";

export const metadata: Metadata = { title: "Mis fincas" };

function Dato({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof Milk;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icono className="text-primary mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{etiqueta}</p>
        <p className="font-semibold tabular-nums">{valor}</p>
      </div>
    </div>
  );
}

export default async function MisFincas() {
  const usuario = await requiereSesion();
  const fincas = await fincasAccesibles(usuario);
  // Con una sola finca se entra directo.
  if (fincas.length === 1) redirect(`/fincas/entrar/${fincas[0].id}`);
  const resumen = await resumenFincas(usuario, fincas);
  const mes = nombreMes(mesActualISO());
  return (
    <>
      <EncabezadoPagina
        titulo="Mis fincas"
        descripcion={`Resumen de ${mes}. Entra a una finca para llevar su control.`}
      />
      {resumen.length === 0 ? (
        <EstadoVacio
          titulo="No tienes fincas asignadas"
          descripcion="Pide al administrador que te dé acceso a una finca."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {resumen.map((f) => (
            <Link key={f.id} href={`/fincas/entrar/${f.id}`} className="group">
              <Card className="group-hover:border-primary h-full transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    {f.nombre}
                    <ArrowRight className="text-muted-foreground group-hover:text-primary size-5" />
                  </CardTitle>
                  {f.ubicacion && <CardDescription>{f.ubicacion}</CardDescription>}
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Dato icono={Beef} etiqueta="Animales" valor={formatoNumero(f.animales)} />
                    <Dato
                      icono={Milk}
                      etiqueta="Vacas en producción"
                      valor={formatoNumero(f.vacasProduccion)}
                    />
                    <Dato
                      icono={Droplets}
                      etiqueta="Litros del mes"
                      valor={formatoLitros(f.litrosMes)}
                    />
                    {f.costoPorLitro !== undefined && (
                      <Dato
                        icono={Wallet}
                        etiqueta="Costo por litro"
                        valor={
                          f.costoPorLitro == null ? "—" : formatoCOP(Math.round(f.costoPorLitro))
                        }
                      />
                    )}
                  </div>
                  {(f.alertas != null || f.retirosLeche != null || f.rentabilidad != null) && (
                    <div className="flex flex-wrap gap-2">
                      {f.alertas != null && (
                        <Badge variant={f.alertas ? "accent" : "secondary"}>
                          <AlertTriangle className="size-3" /> {f.alertas}{" "}
                          {f.alertas === 1 ? "alerta reproductiva" : "alertas reproductivas"}
                        </Badge>
                      )}
                      {f.retirosLeche != null && f.retirosLeche > 0 && (
                        <Badge variant="outline">
                          {f.retirosLeche} {f.retirosLeche === 1 ? "vaca" : "vacas"} en retiro de
                          leche
                        </Badge>
                      )}
                      {f.rentabilidad != null && (
                        <Badge variant={f.rentabilidad < 0 ? "outline" : "secondary"}>
                          Rentabilidad {formatoPorcentaje(f.rentabilidad)}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
