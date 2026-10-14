import "server-only";
import type { Tx } from "@/lib/auditoria";
import { prismaBase } from "@/lib/db";
import { CONCEPTOS_NOMINA, totalesNomina } from "@/lib/dominio/nomina";
import { ErrorNegocio } from "@/lib/errores";
import type { Opcion } from "@/lib/formularios/campos";
import { formatoCOP } from "@/lib/formato";
import { ETIQUETA_TIPO_CONTRATO } from "@/lib/etiquetas";
import { esquemaPago } from "@/lib/validaciones/nomina";

export async function guardarPago(tx: Tx, id: string | null, valores: unknown): Promise<string> {
  const d = esquemaPago.parse(valores) as Record<string, unknown>;
  const errores: Record<string, string> = {};
  if (!(await tx.trabajador.findFirst({ where: { id: String(d.trabajadorId), deletedAt: null } })))
    errores.trabajadorId = "El trabajador no existe.";
  if (
    !(await tx.centroCosto.findFirst({ where: { id: String(d.centroCostoId), deletedAt: null } }))
  )
    errores.centroCostoId = "El centro de costo no existe.";
  if (d.loteId && !(await tx.lote.findFirst({ where: { id: String(d.loteId), deletedAt: null } })))
    errores.loteId = "El lote no existe.";
  if (Object.keys(errores).length) throw new ErrorNegocio("Revisa los datos del pago.", errores);

  const conceptos = Object.fromEntries(CONCEPTOS_NOMINA.map((c) => [c, String(d[c] ?? "0")]));
  const { costoTotal } = totalesNomina(
    Object.fromEntries(CONCEPTOS_NOMINA.map((c) => [c, Number(d[c] ?? 0)])),
  );
  const data = {
    trabajadorId: String(d.trabajadorId),
    fecha: d.fecha as Date,
    periodoInicio: d.periodoInicio as Date | null,
    periodoFin: d.periodoFin as Date | null,
    labor: d.labor as string | null,
    jornales: d.jornales as string | null,
    nivelRiesgoArl: d.nivelRiesgoArl ? Number(d.nivelRiesgoArl) : null,
    centroCostoId: String(d.centroCostoId),
    loteId: d.loteId as string | null,
    nota: d.nota as string | null,
    ...conceptos,
    costoTotal: String(costoTotal),
  };
  if (id) {
    if (!(await tx.pagoNomina.findFirst({ where: { id, deletedAt: null } })))
      throw new ErrorNegocio("El pago no existe o fue eliminado.");
    await tx.pagoNomina.update({ where: { id }, data });
    return id;
  }
  return (await tx.pagoNomina.create({ data })).id;
}

export async function eliminarPago(tx: Tx, id: string): Promise<void> {
  if (!(await tx.pagoNomina.findFirst({ where: { id, deletedAt: null } })))
    throw new ErrorNegocio("El pago no existe o ya fue eliminado.");
  await tx.pagoNomina.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function opcionesNomina(): Promise<Record<string, Opcion[]>> {
  const activo = { deletedAt: null, activo: true } as const;
  const [trabajadores, centros, lotes] = await Promise.all([
    prismaBase.trabajador.findMany({
      where: activo,
      orderBy: [{ eventual: "asc" }, { nombre: "asc" }],
    }),
    prismaBase.centroCosto.findMany({ where: activo, orderBy: { nombre: "asc" } }),
    prismaBase.lote.findMany({ where: activo, orderBy: { nombre: "asc" } }),
  ]);
  return {
    trabajadores: trabajadores.map((t) => ({
      valor: t.id,
      etiqueta: `${t.nombre} · ${ETIQUETA_TIPO_CONTRATO[t.tipoContrato].replace("Contrato ", "")} · ${formatoCOP(t.salarioBase)}`,
    })),
    centros: centros.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
    lotes: lotes.map((l) => ({ valor: l.id, etiqueta: l.nombre })),
  };
}

/** Salario base por trabajador (para proponerlo en el formulario). */
export async function salariosBase(): Promise<Record<string, string>> {
  const t = await prismaBase.trabajador.findMany({
    where: { deletedAt: null },
    select: { id: true, salarioBase: true },
  });
  return Object.fromEntries(t.map((x) => [x.id, x.salarioBase.toString()]));
}
