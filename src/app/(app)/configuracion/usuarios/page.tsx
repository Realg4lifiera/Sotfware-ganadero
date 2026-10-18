import type { Metadata } from "next";
import { prismaBase } from "@/lib/db";
import { formatoFechaHora } from "@/lib/fechas";
import { ETIQUETA_ROL } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { VistaUsuarios, type FilaUsuario } from "./vista-usuarios";

export const metadata: Metadata = { title: "Usuarios" };

export default async function PaginaUsuarios() {
  const yo = await requierePermiso("usuario:gestionar");
  const [usuarios, fincas] = await Promise.all([
    prismaBase.usuario.findMany({
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
      include: { fincas: { where: { deletedAt: null }, select: { fincaId: true } } },
    }),
    prismaBase.finca.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, activa: true },
    }),
  ]);
  const nombreFinca = new Map(fincas.map((f) => [f.id, f.nombre]));
  const filas: FilaUsuario[] = usuarios.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    usuario: u.usuario,
    email: u.email ?? "",
    rol: u.rol,
    rolEtiqueta: ETIQUETA_ROL[u.rol],
    activo: u.activo,
    debeCambiarClave: u.debeCambiarClave,
    ultimoAcceso: u.ultimoAcceso ? formatoFechaHora(u.ultimoAcceso) : "Nunca",
    soyYo: u.id === yo.id,
    fincaIds: u.fincas.map((f) => f.fincaId).filter((id) => nombreFinca.has(id)),
    fincasEtiqueta:
      u.rol === "ADMIN"
        ? "Todas"
        : u.fincas
            .map((f) => nombreFinca.get(f.fincaId))
            .filter(Boolean)
            .sort()
            .join(", ") || "Ninguna",
  }));
  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Quién puede entrar, con qué rol y a qué fincas. Los usuarios nuevos deben cambiar su contraseña al entrar."
        volver={{ href: "/configuracion", texto: "Configuración" }}
      />
      <VistaUsuarios filas={filas} fincas={fincas} />
    </>
  );
}
