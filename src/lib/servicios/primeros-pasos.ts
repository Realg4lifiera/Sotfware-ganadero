import "server-only";
import { prismaBase } from "@/lib/db";
import { idFinca } from "@/lib/finca";

export interface PasoInicial {
  titulo: string;
  descripcion: string;
  href: string;
  hecho: boolean;
  /** No impide dar la finca por lista (hay fincas que maneja solo el administrador). */
  opcional?: boolean;
}

/** Lo mínimo para empezar a usar una finca recién creada, y si ya está hecho. */
export async function pasosIniciales(): Promise<PasoInicial[]> {
  const fincaId = await idFinca();
  const [finca, potreros, lotes, animales, equipo] = await Promise.all([
    prismaBase.finca.findUnique({ where: { id: fincaId }, select: { areaUtilHa: true } }),
    prismaBase.potrero.count({ where: { deletedAt: null } }),
    prismaBase.lote.count({ where: { deletedAt: null } }),
    prismaBase.animal.count({ where: { deletedAt: null } }),
    // UsuarioFinca no lleva el filtro automático de finca (es una tabla de acceso).
    prismaBase.usuarioFinca.count({ where: { fincaId, deletedAt: null } }),
  ]);
  return [
    {
      titulo: "Completa los datos de la finca",
      descripcion: "Área útil (para litros y carga por hectárea), ubicación y parámetros.",
      href: "/configuracion/finca",
      hecho: finca?.areaUtilHa != null,
    },
    {
      titulo: "Crea los potreros",
      descripcion: "Con su área, para la rotación y la carga animal.",
      href: "/configuracion/potreros",
      hecho: potreros > 0,
    },
    {
      titulo: "Crea los lotes",
      descripcion: "Producción, horras y secas, levante, terneras…",
      href: "/configuracion/lotes",
      hecho: lotes > 0,
    },
    {
      titulo: "Registra los animales",
      descripcion: "De una vez con la plantilla de Excel, o uno por uno.",
      href: "/animales/importar",
      hecho: animales > 0,
    },
    {
      titulo: "Da acceso al equipo",
      descripcion: "Mayordomo, veterinario, contador o propietario de esta finca.",
      href: "/configuracion/usuarios",
      hecho: equipo > 0,
      opcional: true,
    },
  ];
}
