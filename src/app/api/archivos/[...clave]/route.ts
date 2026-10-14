import { almacenamiento, claveValida } from "@/lib/almacenamiento";
import { obtenerUsuarioActual } from "@/lib/sesion";

/** Sirve archivos del almacenamiento solo a usuarios con sesión. */
export async function GET(_req: Request, ctx: RouteContext<"/api/archivos/[...clave]">) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  const { clave } = await ctx.params;
  const ruta = clave.join("/");
  if (!claveValida(ruta)) return new Response("No encontrado", { status: 404 });
  const archivo = await almacenamiento().obtener(ruta);
  if (!archivo) return new Response("No encontrado", { status: 404 });
  return new Response(archivo.cuerpo as BodyInit, {
    headers: {
      "Content-Type": archivo.tipoMime,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
