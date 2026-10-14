import type { Rol } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    rol: Rol;
    usuario: string;
  }
  interface Session {
    user: { id: string; rol: Rol; usuario: string } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    rol?: Rol;
    usuario?: string;
  }
}
