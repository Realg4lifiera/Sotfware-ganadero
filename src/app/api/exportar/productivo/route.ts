import { generarExcelProductivo } from "@/lib/excel/exportar-productivo";
import { mesDesdeParametro } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import { indicadoresProductivosMes } from "@/lib/servicios/indicadores-productivos";
import { estadoPotreros } from "@/lib/servicios/rotacion";
import { obtenerUsuarioActual } from "@/lib/sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(req: Request) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  if (!puede(usuario.rol, "reportes:productivos"))
    return new Response("Sin permiso", { status: 403 });
  const mes = mesDesdeParametro(new URL(req.url).searchParams.get("mes"));
  const [i, carga] = await Promise.all([indicadoresProductivosMes(mes), estadoPotreros()]);
  return new Response(await generarExcelProductivo(mes, i, carga), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="productivo-${mes}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
