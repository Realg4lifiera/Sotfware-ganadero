import { generarExcelInventario } from "@/lib/excel/exportar-animales";
import { hoyISO } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import { obtenerUsuarioActual } from "@/lib/sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  if (!puede(usuario.rol, "animal:exportar")) return new Response("Sin permiso", { status: 403 });
  const datos = await generarExcelInventario();
  return new Response(datos, {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="inventario-animales-${hoyISO()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
