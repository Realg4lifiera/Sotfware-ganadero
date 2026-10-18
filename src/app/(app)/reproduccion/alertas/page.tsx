import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TITULO_ALERTA, type TipoAlerta } from "@/lib/dominio/alertas-reproductivas";
import { formatoNumero } from "@/lib/formato";
import { requierePermiso } from "@/lib/sesion";
import { alertasDelHato } from "@/lib/servicios/indicadores-reproductivos";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";

export const metadata: Metadata = { title: "Alertas reproductivas" };

const ORDEN: TipoAlerta[] = [
  "PARTO_PROXIMO",
  "POR_SECAR",
  "PENDIENTE_DIAGNOSTICO",
  "CELO_ESPERADO",
  "VACIA_LARGA",
  "REPETIDORA",
];

export default async function PaginaAlertas() {
  await requierePermiso("reproduccion:leer");
  const [alertas, config] = await Promise.all([alertasDelHato(), obtenerConfiguracionFinca()]);
  const c = config.reproduccion;
  const descripcion: Record<TipoAlerta, string> = {
    PARTO_PROXIMO: `Parto probable en los próximos ${c.diasAlertaParto} días o atrasado.`,
    POR_SECAR: `Preñadas en producción a ${c.diasSecadoAntesParto} días o menos del parto.`,
    PENDIENTE_DIAGNOSTICO: `Servidas hace ${c.diasDiagnostico} días o más, sin diagnóstico.`,
    CELO_ESPERADO: `Servidas cerca del día ${c.diasCiclo} (o múltiplos): observar si repiten celo.`,
    VACIA_LARGA: `Sin preñez y con más de ${c.diasAbiertosMax} días desde el parto.`,
    REPETIDORA: "Tres o más servicios en el ciclo sin preñez.",
  };
  return (
    <>
      <EncabezadoPagina
        titulo="Alertas reproductivas"
        descripcion="Los días se ajustan en Configuración › Finca › Reproducción."
        volver={{ href: "/reproduccion", texto: "Reproducción" }}
      />
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        {ORDEN.map((tipo) => {
          const lista = alertas
            .filter((a) => a.tipo === tipo)
            .sort((a, b) =>
              tipo === "PARTO_PROXIMO" || tipo === "POR_SECAR" ? a.dias - b.dias : b.dias - a.dias,
            );
          return (
            <Card key={tipo} id={tipo.toLowerCase()} className="scroll-mt-20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  {TITULO_ALERTA[tipo]}
                  <Badge variant={lista.length ? "accent" : "secondary"}>
                    {formatoNumero(lista.length)}
                  </Badge>
                </CardTitle>
                <CardDescription>{descripcion[tipo]}</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {lista.length === 0 ? (
                  <p className="text-muted-foreground px-6 text-sm">Ninguna.</p>
                ) : (
                  <ul className="divide-y border-t">
                    {lista.map((a) => (
                      <li key={a.hembraId}>
                        <Link
                          href={`/animales/${a.hembraId}?pestana=reproduccion`}
                          className="hover:bg-muted/40 flex items-center gap-3 px-6 py-2.5"
                        >
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="font-semibold">{a.hembra}</span>
                            <span className="text-muted-foreground truncate text-xs">
                              {a.detalle}
                            </span>
                          </span>
                          <ChevronRight className="text-muted-foreground size-4" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
