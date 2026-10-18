import { generarPlantillaAnimales } from "@/lib/excel/plantilla-animales";
import { puede } from "@/lib/permisos";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { enFinca } from "@/lib/finca-sesion";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function manejar() {
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

/** Corre en la finca activa del usuario (lib/finca-sesion.ts). */
export const GET = enFinca(manejar);
