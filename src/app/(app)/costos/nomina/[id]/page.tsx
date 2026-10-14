import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismaBase } from "@/lib/db";
import { totalesNomina } from "@/lib/dominio/nomina";
import { formatoFecha } from "@/lib/fechas";
import { formatoCOP, formatoNumero } from "@/lib/formato";
import { valoresDesdeRegistro } from "@/lib/formularios/campos";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { opcionesNomina, salariosBase } from "@/lib/servicios/nomina";
import { CAMPOS_PAGO } from "@/lib/validaciones/nomina";
import { Card, CardContent } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { BotonEliminar } from "@/components/boton-eliminar";
import { FormularioPago } from "../formulario-pago";
import { eliminarPago } from "../acciones";

export const metadata: Metadata = { title: "Pago de nómina" };

export default async function PaginaPago({ params }: PageProps<"/costos/nomina/[id]">) {
  const usuario = await requierePermiso("costos:leer");
  const { id } = await params;
  const p = await prismaBase.pagoNomina.findFirst({
    where: { id, deletedAt: null },
    include: { trabajador: true, centroCosto: true, lote: true },
  });
  if (!p) notFound();
  const editable = puede(usuario.rol, "costos:gestionar");
  const n = (x: { toString(): string }) => Number(x);
  const t = totalesNomina({
    salario: n(p.salario),
    auxilioTransporte: n(p.auxilioTransporte),
    salud: n(p.salud),
    pension: n(p.pension),
    arl: n(p.arl),
    prima: n(p.prima),
    vacaciones: n(p.vacaciones),
    cesantias: n(p.cesantias),
    interesesCesantias: n(p.interesesCesantias),
    bonificacion: n(p.bonificacion),
  });

  let contenido: React.ReactNode;
  if (editable) {
    const [opciones, salarios] = await Promise.all([opcionesNomina(), salariosBase()]);
    if (!opciones.trabajadores.some((o) => o.valor === p.trabajadorId))
      opciones.trabajadores.push({
        valor: p.trabajadorId,
        etiqueta: `${p.trabajador.nombre} (inactivo)`,
      });
    contenido = (
      <FormularioPago
        id={p.id}
        valores={valoresDesdeRegistro(CAMPOS_PAGO, p)}
        opcionesDinamicas={opciones}
        salariosBase={salarios}
      />
    );
  } else {
    const filas: [string, string][] = [
      ["Trabajador", p.trabajador.nombre],
      ["Fecha de pago", formatoFecha(p.fecha)],
      [
        "Período",
        p.periodoInicio ? `${formatoFecha(p.periodoInicio)} – ${formatoFecha(p.periodoFin)}` : "—",
      ],
      ["Centro de costo", p.centroCosto.nombre],
      ["Labor", p.labor ?? "—"],
      ["Jornales", p.jornales ? formatoNumero(p.jornales) : "—"],
      ["Salario", formatoCOP(p.salario)],
      ["Auxilio de transporte", formatoCOP(p.auxilioTransporte)],
      ["Bonificación", formatoCOP(p.bonificacion)],
      ["Seguridad social", formatoCOP(t.seguridadSocial)],
      ["Prestaciones", formatoCOP(t.prestaciones)],
      ["Costo total", formatoCOP(p.costoTotal)],
    ];
    contenido = (
      <Card>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {filas.map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground text-xs font-medium">{k}</dt>
                <dd className="text-sm">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      <EncabezadoPagina
        titulo={`Pago a ${p.trabajador.nombre}`}
        descripcion={`${formatoFecha(p.fecha)} · costo total ${formatoCOP(p.costoTotal)}`}
        volver={{ href: "/costos/nomina", texto: "Nómina" }}
        acciones={
          editable && (
            <BotonEliminar
              accion={eliminarPago.bind(null, p.id)}
              titulo="¿Eliminar este pago?"
              descripcion="Deja de contar en los costos. El registro queda en la auditoría."
              destino="/costos/nomina"
            />
          )
        }
      />
      {contenido}
    </>
  );
}
