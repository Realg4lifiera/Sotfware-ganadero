import { generarExcelInventario } from "@/lib/excel/exportar-inventario";
import { mesDesdeParametro } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import { reporteInventario } from "@/lib/servicios/reporte-inventario";
import { obtenerUsuarioActual } from "@/lib/sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(req: Request) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  if (!puede(usuario.rol, "reportes:inventario"))
    return new Response("Sin permiso", { status: 403 });
  const mes = mesDesdeParametro(new URL(req.url).searchParams.get("mes"));
  return new Response(await generarExcelInventario(mes, await reporteInventario(mes)), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="inventario-${mes}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
