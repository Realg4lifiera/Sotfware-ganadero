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
  const usuarios = await prismaBase.usuario.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });
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
  }));
  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Quién puede entrar y con qué rol. Los usuarios nuevos deben cambiar su contraseña al entrar."
        volver={{ href: "/configuracion", texto: "Configuración" }}
      />
      <VistaUsuarios filas={filas} />
    </>
  );
}
