import { generarExcelReporteCostos } from "@/lib/excel/exportar-reporte-costos";
import { puede } from "@/lib/permisos";
import { filtrosReporteCostos } from "@/lib/servicios/filtros-reporte";
import { reporteCostos } from "@/lib/servicios/reporte-costos";
import { obtenerUsuarioActual } from "@/lib/sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(req: Request) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  if (!puede(usuario.rol, "reportes:costos")) return new Response("Sin permiso", { status: 403 });
  const f = filtrosReporteCostos(Object.fromEntries(new URL(req.url).searchParams));
  const r = await reporteCostos(f.desde, f.hasta, f.por);
  return new Response(await generarExcelReporteCostos(r, f.por), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="costos-${f.por}-${f.desde}-a-${f.hasta}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
