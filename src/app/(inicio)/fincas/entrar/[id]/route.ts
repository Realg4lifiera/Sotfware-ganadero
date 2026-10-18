import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_FINCA, fincasAccesibles } from "@/lib/finca-sesion";
import { obtenerUsuarioActual } from "@/lib/sesion";

/** Entra a una finca: guarda la elección (si el usuario tiene acceso) y abre su tablero. */
export async function GET(req: Request, { params }: RouteContext<"/fincas/entrar/[id]">) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return NextResponse.redirect(new URL("/login", req.url));
  const id = Number((await params).id);
  if (!(await fincasAccesibles(usuario)).some((f) => f.id === id))
    return NextResponse.redirect(new URL("/fincas", req.url));
  (await cookies()).set(COOKIE_FINCA, String(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.redirect(new URL("/tablero", req.url));
}
