import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import { prismaBase } from "@/lib/db";
import { costoDeCompra } from "@/lib/dominio/compras";
import { ETIQUETA_ORIGEN_COMPRA } from "@/lib/etiquetas";
import { formatoFecha, formatoFechaHora } from "@/lib/fechas";
import { formatoCOP, formatoNumero } from "@/lib/formato";
import { valoresDesdeRegistro, type Opcion } from "@/lib/formularios/campos";
import { puede } from "@/lib/permisos";
import { requiereSesion } from "@/lib/sesion";
import { opcionesGasto } from "@/lib/servicios/gastos";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { CAMPOS_GASTO } from "@/lib/validaciones/gastos";
import { Card, CardContent } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioGasto } from "../formulario-gasto";
import { BotonEliminarGasto, Soportes } from "./soportes";

export const metadata: Metadata = { title: "Gasto" };

/** Incluye la opción actual aunque esté inactiva (para no perderla al editar). */
function conActual(lista: Opcion[], valor: string | null, etiqueta: string | undefined): Opcion[] {
  return !valor || lista.some((o) => o.valor === valor)
    ? lista
    : [...lista, { valor, etiqueta: `${etiqueta ?? valor} (inactivo)` }];
}

export default async function PaginaGasto({ params }: PageProps<"/costos/gastos/[id]">) {
  const usuario = await requiereSesion();
  const { id } = await params;
  const g = await prismaBase.gasto.findFirst({
    where: { id, deletedAt: null },
    include: {
      categoria: { include: { rubro: true } },
      centroCosto: true,
      proveedor: true,
      insumo: true,
      animal: { select: { numero: true, nombre: true } },
      lote: { select: { nombre: true } },
    },
  });
  if (!g) notFound();
  const propio = g.createdById === usuario.id;
  if (!puede(usuario.rol, "costos:leer") && !(puede(usuario.rol, "gasto:registrar") && propio))
    forbidden();
  const editable = puede(usuario.rol, "costos:gestionar");

  const [config, adjuntos, creador] = await Promise.all([
    obtenerConfiguracionFinca(),
    prismaBase.adjunto.findMany({
      where: { entidad: "Gasto", entidadId: id, deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),
    g.createdById
      ? prismaBase.usuario.findUnique({ where: { id: g.createdById }, select: { nombre: true } })
      : null,
  ]);
  const costo = costoDeCompra(
    { valorTotal: Number(g.valorTotal), valorIva: Number(g.valorIva) },
    config.costos.ivaEsCosto,
  );

  let formulario: React.ReactNode = null;
  if (editable) {
    const o = await opcionesGasto();
    o.categorias = conActual(o.categorias, g.categoriaId, g.categoria.nombre);
    o.centros = conActual(o.centros, g.centroCostoId, g.centroCosto.nombre);
    o.proveedores = conActual(o.proveedores, g.proveedorId, g.proveedor?.nombre);
    o.insumos = conActual(o.insumos, g.insumoId, g.insumo?.nombre);
    o.animales = conActual(o.animales, g.animalId, g.animal?.numero);
    o.lotes = conActual(o.lotes, g.loteId, g.lote?.nombre);
    formulario = (
      <FormularioGasto
        id={g.id}
        valores={valoresDesdeRegistro(CAMPOS_GASTO, g)}
        opcionesDinamicas={o}
        ivaEsCosto={config.costos.ivaEsCosto}
      />
    );
  }

  const datos: [string, React.ReactNode][] = [
    ["Fecha", formatoFecha(g.fecha)],
    ["Categoría", `${g.categoria.nombre} · ${g.categoria.rubro.nombre}`],
    ["Centro de costo", g.centroCosto.nombre],
    ["Proveedor", g.proveedor?.nombre],
    ["Cantidad", formatoNumero(g.cantidad, 3)],
    ["Valor unitario", formatoCOP(g.valorUnitario)],
    ["Descuento", formatoCOP(g.descuento)],
    ["IVA", `${formatoNumero(g.ivaPorcentaje)} % · ${formatoCOP(g.valorIva)}`],
    ["Total pagado", formatoCOP(g.valorTotal)],
    ["Costo", `${formatoCOP(costo)}${config.costos.ivaEsCosto ? "" : " (sin IVA)"}`],
    ["Origen", ETIQUETA_ORIGEN_COMPRA[g.origen]],
    ["Factura", g.numeroFactura],
    ["Asignado a", g.animal ? `Animal ${g.animal.numero}` : g.lote?.nombre],
    ["Notas", g.notas],
  ];

  return (
    <>
      <EncabezadoPagina
        titulo={g.descripcion}
        descripcion={`${formatoCOP(g.valorTotal)} · ${formatoFecha(g.fecha)} · registrado por ${creador?.nombre ?? "—"} el ${formatoFechaHora(g.createdAt)}`}
        volver={{ href: "/costos/gastos", texto: "Compras y gastos" }}
        acciones={editable && <BotonEliminarGasto id={g.id} />}
      />
      <div className="flex flex-col gap-4">
        <Soportes
          gastoId={g.id}
          adjuntos={adjuntos.map((a) => ({
            id: a.id,
            nombre: a.nombreArchivo,
            url: `/api/archivos/${a.clave}`,
            esImagen: a.tipoMime.startsWith("image/"),
          }))}
          puedeSubir={editable || propio}
          puedeQuitar={editable}
        />
        {formulario ?? (
          <Card>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {datos.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground text-xs font-medium">{k}</dt>
                    <dd className="text-sm">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
