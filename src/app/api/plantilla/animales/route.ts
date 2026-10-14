import { generarPlantillaAnimales } from "@/lib/excel/plantilla-animales";
import { puede } from "@/lib/permisos";
import { obtenerUsuarioActual } from "@/lib/sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  if (!puede(usuario.rol, "animal:importar")) return new Response("Sin permiso", { status: 403 });
  const datos = await generarPlantillaAnimales();
  return new Response(datos, {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": 'attachment; filename="plantilla-animales.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
