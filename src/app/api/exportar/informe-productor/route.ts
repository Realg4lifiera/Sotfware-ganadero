import { prismaBase } from "@/lib/db";
import { generarExcelInforme } from "@/lib/excel/exportar-informe";
import { mesDesdeParametro } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import { informeDelMes } from "@/lib/servicios/costos";
import { obtenerUsuarioActual } from "@/lib/sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(req: Request) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  if (!puede(usuario.rol, "reportes:costos")) return new Response("Sin permiso", { status: 403 });
  const mes = mesDesdeParametro(new URL(req.url).searchParams.get("mes"));
  const [inf, finca] = await Promise.all([
    informeDelMes(mes),
    prismaBase.finca.findFirst({ select: { nombre: true } }),
  ]);
  return new Response(await generarExcelInforme(mes, finca?.nombre ?? "", inf), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="informe-productor-${mes}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
