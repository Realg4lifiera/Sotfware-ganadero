import { generarExcelGastos } from "@/lib/excel/exportar-gastos";
import { mesDesdeParametro, rangoMes } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import { obtenerUsuarioActual } from "@/lib/sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(req: Request) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  if (!puede(usuario.rol, "costos:leer")) return new Response("Sin permiso", { status: 403 });
  const mes = mesDesdeParametro(new URL(req.url).searchParams.get("mes"));
  const { desde, hasta } = rangoMes(mes);
  return new Response(await generarExcelGastos(desde, hasta), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="gastos-${mes}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
