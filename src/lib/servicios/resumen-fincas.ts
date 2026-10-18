import "server-only";
import { prismaBase } from "@/lib/db";
import { conFinca } from "@/lib/finca";
import type { FincaAccesible } from "@/lib/finca-sesion";
import { mesActualISO, rangoMes } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import type { UsuarioActual } from "@/lib/sesion";
import { informeDelMes } from "@/lib/servicios/costos";
import { alertasDelHato } from "@/lib/servicios/indicadores-reproductivos";
import { litrosDelPeriodo } from "@/lib/servicios/leche";
import { retirosVigentes } from "@/lib/servicios/sanidad";

export interface ResumenFinca {
  id: number;
  nombre: string;
  ubicacion: string;
  animales: number;
  vacasProduccion: number;
  litrosMes: number;
  /** undefined: el usuario no ve costos; null: sin datos este mes. */
  costoPorLitro: number | null | undefined;
  rentabilidad: number | null | undefined;
  alertas: number | null;
  retirosLeche: number | null;
}

/**
 * Indicadores principales de cada finca para "Mis fincas". Cada finca se calcula en su
 * propio contexto (lib/finca.ts): los datos nunca se mezclan entre fincas.
 */
export async function resumenFincas(
  u: UsuarioActual,
  fincas: FincaAccesible[],
): Promise<ResumenFinca[]> {
  const mes = mesActualISO();
  const { desde, hasta } = rangoMes(mes);
  const verCostos = puede(u.rol, "costos:leer");
  const verRepro = puede(u.rol, "reproduccion:leer");
  const verSanidad = puede(u.rol, "sanidad:leer");
  const datos = await prismaBase.finca.findMany({
    where: { id: { in: fincas.map((f) => f.id) } },
    select: { id: true, municipio: true, departamento: true, vereda: true },
  });
  return Promise.all(
    fincas.map((f) =>
      conFinca(f.id, async () => {
        const [animales, vacasProduccion, litros, informe, alertas, retiros] = await Promise.all([
          prismaBase.animal.count({ where: { deletedAt: null, estado: "ACTIVO" } }),
          prismaBase.lactancia.count({
            where: { deletedAt: null, fechaFin: null, vaca: { estado: "ACTIVO", deletedAt: null } },
          }),
          litrosDelPeriodo(desde, hasta),
          verCostos ? informeDelMes(mes) : null,
          verRepro ? alertasDelHato() : null,
          verSanidad ? retirosVigentes() : null,
        ]);
        const d = datos.find((x) => x.id === f.id);
        return {
          id: f.id,
          nombre: f.nombre,
          ubicacion: [d?.vereda, d?.municipio, d?.departamento].filter(Boolean).join(", "),
          animales,
          vacasProduccion,
          litrosMes: litros.producidos,
          costoPorLitro: informe ? informe.costoPorLitroProducido : undefined,
          rentabilidad: informe ? informe.rentabilidad : undefined,
          alertas: alertas ? alertas.filter((a) => a.tipo !== "CELO_ESPERADO").length : null,
          retirosLeche: retiros
            ? retiros.filter((r) => r.lecheHasta && r.enProduccion).length
            : null,
        };
      }),
    ),
  );
}
