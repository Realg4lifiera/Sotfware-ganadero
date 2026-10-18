import { generarExcelReproductivo } from "@/lib/excel/exportar-reproductivo";
import { mesDesdeParametro } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import { reporteReproductivo } from "@/lib/servicios/reporte-reproductivo";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { enFinca } from "@/lib/finca-sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function manejar(req: Request) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  if (!puede(usuario.rol, "reportes:reproductivos"))
    return new Response("Sin permiso", { status: 403 });
  const mes = mesDesdeParametro(new URL(req.url).searchParams.get("mes"));
  return new Response(await generarExcelReproductivo(await reporteReproductivo(mes)), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="reproductivo-${mes}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Corre en la finca activa del usuario (lib/finca-sesion.ts). */
export const GET = enFinca(manejar);
