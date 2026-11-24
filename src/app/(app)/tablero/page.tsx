import type { Metadata } from "next";
import { AlertTriangle, Beef, CheckCircle2, HeartPulse, Milk, Wallet } from "lucide-react";
import { composicionHato } from "@/lib/dominio/categoria";
import Link from "next/link";
import { formatoCOP, formatoLitros, formatoNumero, formatoPorcentaje } from "@/lib/formato";
import { formatoMes, hoy, mesActualISO, rangoMes } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { TITULO_ALERTA, type TipoAlerta } from "@/lib/dominio/alertas-reproductivas";
import { informeDelMes } from "@/lib/servicios/costos";
import { alertasDelHato } from "@/lib/servicios/indicadores-reproductivos";
import { avisosDelHato } from "@/lib/servicios/avisos-productivos";
import {
  TITULO_AVISO_PRODUCTIVO,
  type TipoAvisoProductivo,
} from "@/lib/dominio/alertas-productivas";
import { retirosVigentes } from "@/lib/servicios/sanidad";
import { animalesConCategoria, obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { litrosDelPeriodo } from "@/lib/servicios/leche";
import { pasosIniciales } from "@/lib/servicios/primeros-pasos";
import { PrimerosPasos } from "@/components/primeros-pasos";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { TablaComposicion } from "@/components/tabla-composicion";

export const metadata: Metadata = { title: "Tablero" };

const ALERTAS_TABLERO: TipoAlerta[] = [
  "PARTO_PROXIMO",
  "POR_SECAR",
  "PENDIENTE_DIAGNOSTICO",
  "CELO_ESPERADO",
  "VACIA_LARGA",
  "REPETIDORA",
];
const AVISOS_TABLERO: TipoAvisoProductivo[] = ["PESAJE_PENDIENTE", "CONTROL_LECHERO"];

function Indicador({
  titulo,
  valor,
  detalle,
  icono: IconoIndicador,
  pendiente,
}: {
  titulo: string;
  valor: React.ReactNode;
  detalle?: React.ReactNode;
  icono: typeof Milk;
  pendiente?: string;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4">
        <CardDescription className="text-foreground/80 font-semibold">{titulo}</CardDescription>
        <IconoIndicador className="text-primary size-5" />
      </CardHeader>
      <CardContent className="px-4">
        {pendiente ? (
          <>
            <p className="font-display text-muted-foreground/60 text-3xl font-semibold">—</p>
            <p className="text-muted-foreground text-xs">{pendiente}</p>
          </>
        ) : (
          <>
            <p className="font-display text-3xl font-semibold">{valor}</p>
            {detalle && <p className="text-muted-foreground text-xs">{detalle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default async function Tablero() {
  const usuario = await requierePermiso("tablero:ver");
  const verCostos = puede(usuario.rol, "costos:leer");
  const verRepro = puede(usuario.rol, "reproduccion:leer");
  const verSanidad = puede(usuario.rol, "sanidad:leer");
  const configura = puede(usuario.rol, "configuracion:gestionar");
  const mesISO = mesActualISO();
  const { desde, hasta } = rangoMes(mesISO);
  const [animales, config, litros, informe, alertas, retiros, avisos, pasos] = await Promise.all([
    animalesConCategoria(),
    obtenerConfiguracionFinca(),
    litrosDelPeriodo(desde, hasta),
    verCostos ? informeDelMes(mesISO) : null,
    verRepro ? alertasDelHato() : [],
    verSanidad ? retirosVigentes() : [],
    avisosDelHato(),
    configura ? pasosIniciales() : [],
  ]);
  const enRetiroLeche = retiros.filter((r) => r.lecheHasta && r.enProduccion).length;
  const categorias = animales.map((a) => a.categoria);
  const { hato, otras, totalHato, totalOtras } = composicionHato(categorias, config.hato);

  const vacas = animales.filter(
    (a) => a.categoria === "VACA_PRODUCCION" || a.categoria === "VACA_SECA",
  );
  const enProduccion = vacas.filter((a) => a.categoria === "VACA_PRODUCCION").length;
  // SECA solo se alcanza desde PREÑADA (máquina de estados): una vaca seca está preñada.
  const prenadas = animales.filter(
    (a) => a.estadoReproductivo === "PRENADA" || a.estadoReproductivo === "SECA",
  );
  const vacasPrenadas = prenadas.filter((a) => a.numeroPartos > 0).length;
  const novillasPrenadas = prenadas.length - vacasPrenadas;
  const mes = formatoMes(hoy());

  // Alertas del tablero: primero las que tienen casos; las que están en cero, en una línea.
  const listaAlertas = [
    ...(verRepro
      ? ALERTAS_TABLERO.map((tipo) => ({
          titulo: TITULO_ALERTA[tipo],
          href: `/reproduccion/alertas#${tipo.toLowerCase()}`,
          n: alertas.filter((a) => a.tipo === tipo).length,
        }))
      : []),
    ...(verSanidad
      ? [
          {
            titulo: "Vacas en retiro de leche",
            href: "/produccion/sanidad#retiros",
            n: enRetiroLeche,
          },
        ]
      : []),
    ...AVISOS_TABLERO.map((tipo) => ({
      titulo: TITULO_AVISO_PRODUCTIVO[tipo],
      href: `/produccion/pendientes#${tipo.toLowerCase()}`,
      n: avisos.filter((a) => a.tipo === tipo).length,
    })),
  ];
  const conCasos = listaAlertas.filter((a) => a.n > 0);
  const alDia = listaAlertas.filter((a) => a.n === 0);

  return (
    <>
      <EncabezadoPagina
        titulo={`Hola, ${usuario.nombre.split(" ")[0]}`}
        descripcion={`Resumen de la finca · ${mes}`}
      />

      {pasos.length > 0 && <PrimerosPasos pasos={pasos} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*]:min-w-0">
        <Indicador
          titulo="Inventario"
          icono={Beef}
          valor={formatoNumero(animales.length)}
          detalle={`${formatoNumero(totalHato)} del hato · ${formatoNumero(totalOtras)} otros`}
        />
        <Indicador
          titulo="Vacas preñadas"
          icono={HeartPulse}
          valor={formatoNumero(vacasPrenadas)}
          detalle={`${vacas.length ? formatoPorcentaje(vacasPrenadas / vacas.length, 0) : "—"} de las vacas · ${novillasPrenadas} novillas`}
        />
        <Indicador
          titulo={`Leche de ${mes.split(" ")[0]}`}
          icono={Milk}
          valor={formatoLitros(litros.producidos)}
          detalle={`${formatoLitros(litros.vendidos)} vendidos · ${enProduccion} vacas en producción`}
        />
        {informe ? (
          <Indicador
            titulo="Costo por litro"
            icono={Wallet}
            valor={
              informe.costoPorLitroProducido === null
                ? "—"
                : formatoCOP(Math.round(informe.costoPorLitroProducido))
            }
            pendiente={
              informe.costoPorLitroProducido === null
                ? "Sin litros registrados este mes"
                : undefined
            }
            detalle={
              <Link href="/reportes/informe-productor" className="hover:underline">
                Litro producido · rentabilidad {formatoPorcentaje(informe.rentabilidad)}
              </Link>
            }
          />
        ) : (
          <Indicador
            titulo="Vacas en producción"
            icono={Milk}
            valor={formatoNumero(enProduccion)}
            detalle={`${formatoNumero(vacas.length - enProduccion)} secas`}
          />
        )}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Inventario por categoría</CardTitle>
            <CardDescription>
              Composición del hato real frente al ideal (configurable en Finca).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-0 sm:px-5">
            <TablaComposicion titulo="Inventario bovino" filas={hato} total={totalHato} conIdeal />
            <TablaComposicion
              titulo="Ganado de carne y otras especies"
              filas={otras}
              total={totalOtras}
              conIdeal={false}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-warning size-5" /> Alertas
              </CardTitle>
              <CardDescription>
                {verRepro || verSanidad
                  ? "Reproducción, sanidad y producción del hato."
                  : "Producción del hato."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conCasos.length > 0 && (
                <ul className="flex flex-col gap-2 text-sm">
                  {conCasos.map((a) => (
                    <li key={a.href}>
                      <Link
                        href={a.href}
                        className="bg-muted/60 hover:bg-muted flex items-center justify-between gap-2 rounded-md px-3 py-2.5 font-medium"
                      >
                        {a.titulo}
                        <Badge variant="accent">{formatoNumero(a.n)}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {alDia.length > 0 && (
                <p className="text-muted-foreground mt-3 flex gap-2 text-sm">
                  <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="text-foreground font-medium">Al día: </span>
                    {alDia.map((a) => a.titulo.toLowerCase()).join(", ")}.
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por lote</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col divide-y text-sm">
                {Object.entries(
                  animales.reduce<Record<string, number>>((acc, a) => {
                    const k = a.lote?.nombre ?? "Sin lote";
                    acc[k] = (acc[k] ?? 0) + 1;
                    return acc;
                  }, {}),
                )
                  .sort(([a], [b]) => a.localeCompare(b, "es"))
                  .map(([lote, n]) => (
                    <li key={lote} className="flex justify-between py-2">
                      <span>{lote}</span>
                      <span className="font-semibold tabular-nums">{n}</span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
