import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  Baby,
  Droplets,
  GitFork,
  Milk,
  Pencil,
  Stethoscope,
  Syringe,
  Wallet,
  XCircle,
  Tag,
  Info,
} from "lucide-react";
import { calcularCategoria, ETIQUETA_CATEGORIA } from "@/lib/dominio/categoria";
import {
  ETIQUETA_ESPECIE,
  ETIQUETA_ESTADO_ANIMAL,
  ETIQUETA_ESTADO_REPRODUCTIVO,
  ETIQUETA_METODO_DIAGNOSTICO,
  ETIQUETA_METODO_PESAJE,
  ETIQUETA_ORIGEN,
  ETIQUETA_RESULTADO_DIAGNOSTICO,
  ETIQUETA_SEXO,
  ETIQUETA_TIPO_EVENTO_SANITARIO,
  ETIQUETA_TIPO_MOVIMIENTO,
  ETIQUETA_TIPO_PARTO,
  ETIQUETA_TIPO_SERVICIO,
} from "@/lib/etiquetas";
import { diasEntre, edadTexto, formatoFecha, formatoFechaHora, hoy, hoyISO } from "@/lib/fechas";
import { formatoCOP, formatoKg, formatoNumero } from "@/lib/formato";
import { pesajesConGanancia } from "@/lib/indicadores/peso";
import { puede, puedeAlguno } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { prismaBase } from "@/lib/db";
import { obtenerHojaVida, type HojaVida } from "@/lib/servicios/hoja-vida";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import type { TipoMovimientoRegistrable } from "@/lib/validaciones/animales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstadoVacio } from "@/components/estado-vacio";
import { FotoAnimal } from "../foto-animal";
import { BotonEliminarAnimal, BotonMovimiento } from "./acciones-animal";
import { SubirFoto } from "./subir-foto";

export async function generateMetadata({ params }: PageProps<"/animales/[id]">): Promise<Metadata> {
  const { id } = await params;
  const a = await prismaBase.animal.findUnique({
    where: { id },
    select: { numero: true, nombre: true },
  });
  return { title: a ? `${a.numero}${a.nombre ? ` · ${a.nombre}` : ""}` : "Animal" };
}

const fotoUrl = (clave: string | null) => (clave ? `/api/archivos/${clave}` : null);

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs font-medium">{etiqueta}</dt>
      <dd className="text-sm">{children || "—"}</dd>
    </div>
  );
}

export default async function HojaDeVida({ params }: PageProps<"/animales/[id]">) {
  const usuario = await requierePermiso("animal:leer");
  const { id } = await params;
  const datos = await obtenerHojaVida(id);
  if (!datos) notFound();
  const { animal: a, hijosComoToro } = datos;

  const config = await obtenerConfiguracionFinca();
  const ref = hoy();
  const lactanciaAbierta = a.lactancias.find((l) => !l.fechaFin);
  const categoria = calcularCategoria(
    {
      especie: a.especie,
      sexo: a.sexo,
      fechaNacimiento: a.fechaNacimiento,
      numeroPartos: a.numeroPartos,
      lactanciaAbierta: !!lactanciaAbierta,
      esToro: !!a.toro,
    },
    ref,
    config.hato,
  );

  // Movimientos que este usuario puede registrar según el estado del animal.
  const tipos: TipoMovimientoRegistrable[] = [];
  if (a.estado === "ACTIVO" && puede(usuario.rol, "animal:trasladar"))
    tipos.push("TRASLADO_LOTE", "TRASLADO_POTRERO");
  if (puede(usuario.rol, "animal:movimiento")) {
    if (a.estado === "ACTIVO") tipos.push("VENTA", "DESCARTE", "MUERTE");
    if (a.estado === "DESCARTADO") tipos.push("VENTA");
  }
  const [lotes, potreros, compradores] = tipos.length
    ? await Promise.all([
        prismaBase.lote.findMany({
          where: { deletedAt: null, activo: true },
          orderBy: { nombre: "asc" },
        }),
        prismaBase.potrero.findMany({
          where: { deletedAt: null, activo: true },
          orderBy: { nombre: "asc" },
        }),
        prismaBase.comprador.findMany({
          where: { deletedAt: null, activo: true },
          orderBy: { nombre: "asc" },
        }),
      ])
    : [[], [], []];
  const opciones = {
    lotes: lotes.map((x) => ({ valor: x.id, etiqueta: x.nombre })),
    potreros: potreros.map((x) => ({ valor: x.id, etiqueta: x.nombre })),
    compradores: compradores.map((x) => ({ valor: x.id, etiqueta: x.nombre })),
  };

  const verRepro = puede(usuario.rol, "reproduccion:leer");
  const verProd = puede(usuario.rol, "produccion:leer");
  const verSanidad = puede(usuario.rol, "sanidad:leer");
  const verCostos = puedeAlguno(usuario.rol, ["costos:leer", "costos:leer-sanidad"]);

  return (
    <>
      {/* Encabezado */}
      <Link
        href="/animales"
        className="text-muted-foreground hover:text-foreground mb-2 inline-flex text-sm"
      >
        ← Animales
      </Link>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start">
        <FotoAnimal
          url={fotoUrl(a.fotoClave)}
          sexo={a.sexo}
          className="size-28 rounded-xl sm:size-32"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="text-3xl font-semibold">
            {a.numero}
            {a.nombre && <span className="text-muted-foreground"> · {a.nombre}</span>}
          </h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge>{ETIQUETA_CATEGORIA[categoria]}</Badge>
            {a.estadoReproductivo &&
              !(a.estadoReproductivo === "NOVILLA" && categoria.startsWith("TERNERA")) && (
                <Badge variant="accent">{ETIQUETA_ESTADO_REPRODUCTIVO[a.estadoReproductivo]}</Badge>
              )}
            {lactanciaAbierta && (
              <Badge variant="secondary">
                <Milk /> En ordeño · {diasEntre(lactanciaAbierta.fechaInicio, ref)} días
              </Badge>
            )}
            {a.estado !== "ACTIVO" && (
              <Badge variant="destructive">{ETIQUETA_ESTADO_ANIMAL[a.estado]}</Badge>
            )}
            {a.toro && <Badge variant="outline">Toro reproductor</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">
            {ETIQUETA_SEXO[a.sexo]} · {a.raza?.nombre ?? "Raza sin registrar"}
            {a.fechaNacimiento &&
              ` · ${edadTexto(a.fechaNacimiento, ref)}${a.fechaNacimientoEstimada ? " (aprox.)" : ""}`}
            {a.lote && ` · ${a.lote.nombre}`}
            {a.potrero && ` · ${a.potrero.nombre}`}
          </p>
          <div className="flex flex-wrap gap-2">
            <BotonMovimiento
              animalId={a.id}
              tipos={tipos}
              opciones={opciones}
              loteActualId={a.loteId}
              potreroActualId={a.potreroId}
              hoyISO={hoyISO()}
            />
            {puede(usuario.rol, "animal:editar") && (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/animales/${a.id}/editar`}>
                    <Pencil /> Editar
                  </Link>
                </Button>
                <SubirFoto animalId={a.id} tieneFoto={!!a.fotoClave} />
              </>
            )}
            {puede(usuario.rol, "animal:eliminar") && (
              <BotonEliminarAnimal animalId={a.id} numero={a.numero} />
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">
            <Info /> Datos
          </TabsTrigger>
          <TabsTrigger value="genealogia">
            <GitFork /> Genealogía
          </TabsTrigger>
          {verRepro && (
            <TabsTrigger value="reproduccion">
              <Activity /> Reproducción
            </TabsTrigger>
          )}
          {verProd && (
            <TabsTrigger value="produccion">
              <Milk /> Producción
            </TabsTrigger>
          )}
          {verSanidad && (
            <TabsTrigger value="sanidad">
              <Syringe /> Sanidad
            </TabsTrigger>
          )}
          {verCostos && (
            <TabsTrigger value="costos">
              <Wallet /> Costos
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="datos" className="flex flex-col gap-4">
          <PestanaDatos a={a} />
        </TabsContent>
        <TabsContent value="genealogia">
          <PestanaGenealogia a={a} hijosComoToro={hijosComoToro} />
        </TabsContent>
        {verRepro && (
          <TabsContent value="reproduccion">
            <PestanaReproduccion a={a} hijosComoToro={hijosComoToro.length} />
          </TabsContent>
        )}
        {verProd && (
          <TabsContent value="produccion" className="flex flex-col gap-4">
            <PestanaProduccion a={a} />
          </TabsContent>
        )}
        {verSanidad && (
          <TabsContent value="sanidad">
            <PestanaSanidad a={a} />
          </TabsContent>
        )}
        {verCostos && (
          <TabsContent value="costos">
            <PestanaCostos a={a} soloSanidad={!puede(usuario.rol, "costos:leer")} />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

// ── Pestañas ─────────────────────────────────────────────────────────────────

function PestanaDatos({ a }: { a: HojaVida }) {
  return (
    <>
      <Card>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Dato etiqueta="Número / chapeta">{a.numero}</Dato>
            <Dato etiqueta="Nombre">{a.nombre}</Dato>
            <Dato etiqueta="Especie">{ETIQUETA_ESPECIE[a.especie]}</Dato>
            <Dato etiqueta="Sexo">{ETIQUETA_SEXO[a.sexo]}</Dato>
            <Dato etiqueta="Raza">{a.raza?.nombre}</Dato>
            <Dato etiqueta="Nacimiento">
              {formatoFecha(a.fechaNacimiento)}
              {a.fechaNacimientoEstimada && " (aprox.)"}
            </Dato>
            <Dato etiqueta="Origen">{ETIQUETA_ORIGEN[a.origen]}</Dato>
            <Dato etiqueta="Ingreso a la finca">{formatoFecha(a.fechaIngreso)}</Dato>
            <Dato etiqueta="Peso al nacer">
              {a.pesoNacimientoKg ? formatoKg(a.pesoNacimientoKg) : null}
            </Dato>
            <Dato etiqueta="Lote">{a.lote?.nombre}</Dato>
            <Dato etiqueta="Potrero">{a.potrero?.nombre}</Dato>
            <Dato etiqueta="Estado">{ETIQUETA_ESTADO_ANIMAL[a.estado]}</Dato>
            {a.sexo === "HEMBRA" && <Dato etiqueta="Partos">{formatoNumero(a.numeroPartos)}</Dato>}
            {a.fechaSalida && <Dato etiqueta="Fecha de salida">{formatoFecha(a.fechaSalida)}</Dato>}
          </dl>
          {a.observaciones && (
            <p className="bg-muted/60 mt-4 rounded-md p-3 text-sm whitespace-pre-line">
              {a.observaciones}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-5">
          {a.movimientos.length === 0 ? (
            <p className="text-muted-foreground px-5 text-sm sm:px-0">
              Sin movimientos registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Movimiento</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {a.movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">{formatoFecha(m.fecha)}</TableCell>
                    <TableCell className="font-medium">
                      {ETIQUETA_TIPO_MOVIMIENTO[m.tipo]}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[
                        m.tipo === "TRASLADO_LOTE" &&
                          `${m.loteOrigen?.nombre ?? "Sin lote"} → ${m.loteDestino?.nombre}`,
                        m.tipo === "TRASLADO_POTRERO" &&
                          `${m.potreroOrigen?.nombre ?? "Sin potrero"} → ${m.potreroDestino?.nombre}`,
                        m.comprador?.nombre,
                        m.proveedor?.nombre,
                        m.pesoKg && formatoKg(m.pesoKg),
                        m.motivo,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.valor ? formatoCOP(m.valor) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

type Ficha = {
  id?: string;
  titulo: string;
  detalle?: string;
  rol: string;
  foto?: string | null;
  enlace?: string;
};

function FichaPariente({ f }: { f: Ficha }) {
  const contenido = (
    <div className="bg-card flex h-full items-center gap-3 rounded-lg border p-3">
      {f.foto !== undefined && <FotoAnimal url={f.foto} className="size-10" />}
      <div className="min-w-0">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          {f.rol}
        </p>
        <p className="font-semibold break-words">{f.titulo}</p>
        {f.detalle && <p className="text-muted-foreground truncate text-xs">{f.detalle}</p>}
      </div>
    </div>
  );
  return f.enlace ? (
    <Link href={f.enlace} className="hover:[&>div]:border-primary/60 block h-full">
      {contenido}
    </Link>
  ) : (
    contenido
  );
}

function PestanaGenealogia({
  a,
  hijosComoToro,
}: {
  a: HojaVida;
  hijosComoToro: {
    id: string;
    numero: string;
    nombre: string | null;
    sexo: string;
    fotoClave: string | null;
  }[];
}) {
  const desconocido = (rol: string): Ficha => ({ rol, titulo: "Sin registrar" });
  const madre: Ficha = a.madre
    ? {
        rol: "Madre",
        titulo: `${a.madre.numero}${a.madre.nombre ? ` · ${a.madre.nombre}` : ""}`,
        detalle: a.madre.raza?.nombre,
        foto: fotoUrl(a.madre.fotoClave),
        enlace: `/animales/${a.madre.id}`,
      }
    : desconocido("Madre");
  const padre: Ficha = a.padre
    ? {
        rol: "Padre",
        titulo: a.padre.nombre,
        detalle: [a.padre.codigo, a.padre.raza?.nombre, a.padre.propio ? "Propio" : "Pajilla"]
          .filter(Boolean)
          .join(" · "),
        enlace: a.padre.animalId ? `/animales/${a.padre.animalId}` : undefined,
      }
    : desconocido("Padre");
  const abuela = (
    rol: string,
    x:
      | { id: string; numero: string; nombre: string | null; fotoClave: string | null }
      | null
      | undefined,
  ): Ficha =>
    x
      ? {
          rol,
          titulo: `${x.numero}${x.nombre ? ` · ${x.nombre}` : ""}`,
          foto: fotoUrl(x.fotoClave),
          enlace: `/animales/${x.id}`,
        }
      : desconocido(rol);
  const abuelo = (
    rol: string,
    x: { nombre: string; codigo: string | null; animalId: string | null } | null | undefined,
  ): Ficha =>
    x
      ? {
          rol,
          titulo: x.nombre,
          detalle: x.codigo ?? undefined,
          enlace: x.animalId ? `/animales/${x.animalId}` : undefined,
        }
      : desconocido(rol);

  const descendencia = [
    ...a.crias.map((c) => ({ ...c, via: "madre" })),
    ...hijosComoToro.map((c) => ({ ...c, via: "padre" })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <FichaPariente f={abuela("Abuela materna", a.madre?.madre)} />
            <FichaPariente f={abuelo("Abuelo materno", a.madre?.padre)} />
            <FichaPariente f={abuela("Abuela paterna", a.padre?.animal?.madre)} />
            <FichaPariente f={abuelo("Abuelo paterno", a.padre?.animal?.padre)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FichaPariente f={madre} />
            <FichaPariente f={padre} />
          </div>
          <div className="mx-auto w-full max-w-sm">
            <FichaPariente
              f={{
                rol: "Este animal",
                titulo: `${a.numero}${a.nombre ? ` · ${a.nombre}` : ""}`,
                detalle: a.raza?.nombre,
                foto: fotoUrl(a.fotoClave),
              }}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Descendencia ({descendencia.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {descendencia.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin crías registradas.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {descendencia.map((c) => (
                <FichaPariente
                  key={c.id}
                  f={{
                    rol: `${c.sexo === "HEMBRA" ? "Hija" : "Hijo"}`,
                    titulo: `${c.numero}${c.nombre ? ` · ${c.nombre}` : ""}`,
                    foto: fotoUrl(c.fotoClave),
                    enlace: `/animales/${c.id}`,
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PestanaReproduccion({ a, hijosComoToro }: { a: HojaVida; hijosComoToro: number }) {
  if (a.sexo === "MACHO") {
    return (
      <EstadoVacio
        titulo={
          a.toro
            ? `Reproductor con ${hijosComoToro} crías registradas`
            : "Sin historial reproductivo"
        }
        descripcion="Las crías de este toro se ven en la pestaña Genealogía."
      />
    );
  }
  const eventos = [
    ...a.celos.map((e) => ({
      fecha: e.fechaHora,
      icono: Activity,
      titulo: "Celo",
      detalle: e.observaciones ?? formatoFechaHora(e.fechaHora),
    })),
    ...a.servicios.map((e) => ({
      fecha: e.fecha,
      icono: Syringe,
      titulo: `${ETIQUETA_TIPO_SERVICIO[e.tipo]} (servicio ${e.numeroServicio})`,
      detalle: [e.toro?.nombre ?? e.pajilla?.toro.nombre, e.pajilla?.codigo, e.inseminador]
        .filter(Boolean)
        .join(" · "),
    })),
    ...a.diagnosticos.map((e) => ({
      fecha: e.fecha,
      icono: Stethoscope,
      titulo: `Diagnóstico: ${ETIQUETA_RESULTADO_DIAGNOSTICO[e.resultado]}`,
      detalle: [
        ETIQUETA_METODO_DIAGNOSTICO[e.metodo],
        e.diasGestacion && `${e.diasGestacion} días de gestación`,
        e.fechaProbableParto && `parto probable ${formatoFecha(e.fechaProbableParto)}`,
        e.veterinario,
      ]
        .filter(Boolean)
        .join(" · "),
    })),
    ...a.partos.map((e) => ({
      fecha: e.fecha,
      icono: Baby,
      titulo: `Parto ${ETIQUETA_TIPO_PARTO[e.tipo].toLowerCase()}`,
      detalle: [
        e.toro?.nombre && `Toro ${e.toro.nombre}`,
        ...e.crias.map((c) => `${c.sexo === "HEMBRA" ? "cría hembra" : "cría macho"} ${c.numero}`),
      ]
        .filter(Boolean)
        .join(" · "),
    })),
    ...a.abortos.map((e) => ({
      fecha: e.fecha,
      icono: XCircle,
      titulo: "Aborto",
      detalle: e.causa ?? "",
    })),
    ...a.secados.map((e) => ({
      fecha: e.fecha,
      icono: Droplets,
      titulo: "Secado",
      detalle: e.observaciones ?? "",
    })),
    ...a.descartesReproductivos.map((e) => ({
      fecha: e.fecha,
      icono: Tag,
      titulo: "Descarte reproductivo",
      detalle: e.motivo,
    })),
  ].sort((x, y) => y.fecha.getTime() - x.fecha.getTime());

  const ultimoParto = a.partos[0];
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Dato etiqueta="Estado reproductivo">
              {a.estadoReproductivo ? ETIQUETA_ESTADO_REPRODUCTIVO[a.estadoReproductivo] : null}
            </Dato>
            <Dato etiqueta="Partos">{formatoNumero(a.numeroPartos)}</Dato>
            <Dato etiqueta="Último parto">
              {ultimoParto ? formatoFecha(ultimoParto.fecha) : null}
            </Dato>
            <Dato etiqueta="Días desde el parto">
              {ultimoParto ? formatoNumero(diasEntre(ultimoParto.fecha, hoy())) : null}
            </Dato>
          </dl>
          <p className="text-muted-foreground mt-3 text-xs">
            El registro de eventos (celos, servicios, diagnósticos, partos…) se habilita con el
            módulo reproductivo. Aquí se ve el historial existente.
          </p>
        </CardContent>
      </Card>
      {eventos.length === 0 ? (
        <EstadoVacio
          titulo="Sin eventos reproductivos"
          descripcion="Aparecerán aquí con el módulo reproductivo."
        />
      ) : (
        <ol className="border-border relative flex flex-col gap-3 border-l-2 pl-5">
          {eventos.map((e, i) => (
            <li key={i} className="relative">
              <span className="bg-card absolute top-1 -left-[1.95rem] flex size-6 items-center justify-center rounded-full border">
                <e.icono className="text-primary size-3.5" />
              </span>
              <p className="text-sm font-semibold">
                {e.titulo}{" "}
                <span className="text-muted-foreground font-normal">· {formatoFecha(e.fecha)}</span>
              </p>
              {e.detalle && <p className="text-muted-foreground text-sm">{e.detalle}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function PestanaProduccion({ a }: { a: HojaVida }) {
  const ref = hoy();
  const pesajes = pesajesConGanancia(
    a.pesajes.map((p) => ({ ...p, pesoKg: Number(p.pesoKg) })),
  ).reverse();
  return (
    <>
      {a.sexo === "HEMBRA" && a.especie === "BOVINO" && (
        <Card>
          <CardHeader>
            <CardTitle>Lactancias</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-5">
            {a.lactancias.length === 0 ? (
              <p className="text-muted-foreground px-5 text-sm sm:px-0">
                Sin lactancias registradas.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N.º</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin (secado)</TableHead>
                    <TableHead className="text-right">Días en leche</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {a.lactancias.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.numero}</TableCell>
                      <TableCell>{formatoFecha(l.fechaInicio)}</TableCell>
                      <TableCell>
                        {l.fechaFin ? (
                          formatoFecha(l.fechaFin)
                        ) : (
                          <Badge variant="secondary">En curso</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatoNumero(diasEntre(l.fechaInicio, l.fechaFin ?? ref))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <p className="text-muted-foreground mt-3 px-5 text-xs sm:px-0">
              Los litros por ordeño y la producción ajustada a 305 días llegan con el módulo
              productivo.
            </p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Pesajes</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-5">
          {pesajes.length === 0 ? (
            <p className="text-muted-foreground px-5 text-sm sm:px-0">Sin pesajes registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Peso</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead>Método</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pesajes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatoFecha(p.fecha)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatoKg(p.pesoKg)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.gdpGramos === null ? "—" : `${formatoNumero(p.gdpGramos)} g/día`}
                    </TableCell>
                    <TableCell>{ETIQUETA_METODO_PESAJE[p.metodo]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function PestanaSanidad({ a }: { a: HojaVida }) {
  if (a.eventosSanitarios.length === 0) {
    return (
      <EstadoVacio
        icono={Syringe}
        titulo="Sin eventos sanitarios"
        descripcion="Vacunas, desparasitaciones y tratamientos (con sus retiros de leche y carne) se registrarán con el módulo de sanidad."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {a.eventosSanitarios.map((e) => (
        <li key={e.id} className="bg-card rounded-lg border p-3 text-sm">
          <p className="font-semibold">
            {ETIQUETA_TIPO_EVENTO_SANITARIO[e.tipo]}: {e.producto}
            <span className="text-muted-foreground font-normal"> · {formatoFecha(e.fecha)}</span>
          </p>
          <p className="text-muted-foreground">
            {[
              e.dosis,
              e.veterinario,
              e.retiroLecheHasta && `retiro de leche hasta ${formatoFecha(e.retiroLecheHasta)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Rubros visibles para quien solo tiene costos:leer-sanidad (veterinario). */
const esRubroSanitario = (rubro: string) => /sanidad|reproduc/i.test(rubro.normalize("NFD"));

function PestanaCostos({ a, soloSanidad }: { a: HojaVida; soloSanidad: boolean }) {
  const gastos = soloSanidad
    ? a.gastos.filter((g) => esRubroSanitario(g.categoria.rubro.nombre))
    : a.gastos;
  const ingresos = soloSanidad ? [] : a.ingresos;
  if (gastos.length === 0 && ingresos.length === 0) {
    return (
      <EstadoVacio
        icono={Wallet}
        titulo="Sin costos asignados"
        descripcion="Los gastos asignados directamente a este animal y sus ingresos aparecerán aquí con el módulo de costos."
      />
    );
  }
  return (
    <Card>
      <CardContent className="px-0 sm:px-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gastos.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{formatoFecha(g.fecha)}</TableCell>
                <TableCell>
                  {g.descripcion}{" "}
                  <span className="text-muted-foreground">· {g.categoria.nombre}</span>
                </TableCell>
                <TableCell className="text-destructive text-right tabular-nums">
                  -{formatoCOP(g.valorTotal)}
                </TableCell>
              </TableRow>
            ))}
            {ingresos.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{formatoFecha(i.fecha)}</TableCell>
                <TableCell>{i.concepto}</TableCell>
                <TableCell className="text-success text-right tabular-nums">
                  {formatoCOP(i.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
