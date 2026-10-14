import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Exige sesión en toda la app. Es solo la primera barrera: los permisos por rol se
 * validan en cada página (requierePermiso) y en cada server action (accion).
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const publica = pathname === "/login" || pathname.startsWith("/api/auth");
  if (!req.auth && !publica) {
    const url = new URL("/login", req.nextUrl.origin);
    if (pathname !== "/") url.searchParams.set("desde", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (req.auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/tablero", req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
