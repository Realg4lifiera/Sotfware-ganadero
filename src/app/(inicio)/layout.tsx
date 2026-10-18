import { ETIQUETA_ROL } from "@/lib/permisos";
import { requiereSesion } from "@/lib/sesion";
import { MenuUsuario } from "@/components/layout/menu-usuario";
import Image from "next/image";

/** Pantallas fuera de una finca (elegir finca). */
export default async function LayoutInicio({ children }: LayoutProps<"/">) {
  const usuario = await requiereSesion();
  return (
    <div className="min-h-dvh">
      <header className="bg-sidebar text-sidebar-foreground sticky top-0 z-30 flex items-center gap-3 px-4 py-3">
        <Image src="/insignia.png" alt="" width={36} height={36} className="size-9" />
        <span className="font-display min-w-0 flex-1 text-lg font-semibold tracking-wider">
          CAMPO VERDE
        </span>
        <MenuUsuario
          nombre={usuario.nombre}
          rol={ETIQUETA_ROL[usuario.rol]}
          className="max-w-[50%]"
        />
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
