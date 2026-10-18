import { almacenamiento, claveValida } from "@/lib/almacenamiento";
import { prismaBase } from "@/lib/db";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { enFinca } from "@/lib/finca-sesion";

/**
 * Sirve archivos del almacenamiento solo a usuarios con sesión y solo si el archivo es de
 * la finca activa (un soporte adjunto o la foto de un animal de esa finca).
 */
async function manejar(_req: Request, ctx: RouteContext<"/api/archivos/[...clave]">) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new Response("No autorizado", { status: 401 });
  const { clave } = await ctx.params;
  const ruta = clave.join("/");
  if (!claveValida(ruta)) return new Response("No encontrado", { status: 404 });
  // Las consultas ya están filtradas por la finca activa (lib/finca.ts).
  const [adjuntos, fotos] = await Promise.all([
    prismaBase.adjunto.count({ where: { clave: ruta, deletedAt: null } }),
    prismaBase.animal.count({ where: { fotoClave: ruta } }),
  ]);
  if (adjuntos + fotos === 0) return new Response("No encontrado", { status: 404 });
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

/** Corre en la finca activa del usuario (lib/finca-sesion.ts). */
export const GET = enFinca(manejar);
