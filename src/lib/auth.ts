import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prismaBase } from "@/lib/db";

const credencialesSchema = z.object({
  usuario: z.string().trim().toLowerCase().min(1),
  clave: z.string().min(1),
});

class CredencialesInvalidas extends CredentialsSignin {
  code = "credenciales";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        usuario: { label: "Usuario" },
        clave: { label: "Contraseña", type: "password" },
      },
      async authorize(credenciales) {
        const r = credencialesSchema.safeParse(credenciales);
        if (!r.success) throw new CredencialesInvalidas();
        const u = await prismaBase.usuario.findUnique({ where: { usuario: r.data.usuario } });
        // Se compara siempre para no revelar por tiempo si el usuario existe.
        const hash =
          u?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
        const ok = await bcrypt.compare(r.data.clave, hash);
        if (!u || !ok || !u.activo) throw new CredencialesInvalidas();
        // Tarea del sistema: no pasa por auditoría.
        await prismaBase.usuario.update({
          where: { id: u.id },
          data: { ultimoAcceso: new Date() },
        });
        return { id: u.id, name: u.nombre, email: u.email, rol: u.rol, usuario: u.usuario };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
        token.usuario = user.usuario;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.rol) session.user.rol = token.rol;
      if (token.usuario) session.user.usuario = token.usuario;
      return session;
    },
  },
});
