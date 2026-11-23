import Link from "next/link";
import { KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import { formatoFechaHora } from "@/lib/fechas";
import { navegacionPara } from "@/lib/navegacion";
import { ETIQUETA_ROL, puede } from "@/lib/permisos";
import { fincaActual, fincasAccesibles } from "@/lib/finca-sesion";
import { requiereSesion } from "@/lib/sesion";
import { ListaNavegacion } from "@/components/layout/lista-navegacion";
import { Marca } from "@/components/layout/marca";
import { MenuUsuario } from "@/components/layout/menu-usuario";
import { MenuDesplegable, MenuInferior } from "@/components/layout/navegacion-movil";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const usuario = await requiereSesion();
  // Todo lo de esta sección es de una finca: sin finca elegida se va a "Mis fincas".
  const finca = await fincaActual();
  if (!finca) redirect("/fincas");
  const nombreFinca = finca.nombre;
  // Con varias fincas, o si puede crear fincas (administrador), se llega a "Mis fincas".
  const variasFincas =
    puede(usuario.rol, "finca:gestionar") || (await fincasAccesibles(usuario)).length > 1;
  const secciones = navegacionPara(usuario.rol);
  const registrosRapidos = secciones.flatMap((s) => s.paginas).filter((p) => p.registroRapido);
  const rol = ETIQUETA_ROL[usuario.rol];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr] print:block">
      {/* Escritorio: barra lateral */}
      <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-dvh flex-col lg:flex print:hidden">
        <div className="border-sidebar-border border-b px-5 py-4">
          <Marca nombreFinca={nombreFinca} cambiar={variasFincas} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <ListaNavegacion secciones={secciones} />
        </div>
        <div className="border-sidebar-border border-t p-2">
          <MenuUsuario nombre={usuario.nombre} rol={rol} className="w-full" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Celular: barra superior */}
        <header className="bg-sidebar text-sidebar-foreground sticky top-0 z-30 flex items-center gap-2 px-2 py-2 lg:hidden print:hidden">
          <MenuDesplegable secciones={secciones} nombreFinca={nombreFinca} cambiar={variasFincas} />
          <div className="min-w-0 flex-1">
            <Marca nombreFinca={nombreFinca} cambiar={variasFincas} />
          </div>
          <MenuUsuario nombre={usuario.nombre} rol={rol} className="max-w-[40%]" />
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pb-10 print:max-w-none print:p-0">
          {/* Membrete de los PDF (solo al imprimir). */}
          <p className="text-muted-foreground mb-3 hidden border-b pb-2 text-xs print:block">
            {nombreFinca} · Generado el {formatoFechaHora(new Date())}
          </p>
          {usuario.debeCambiarClave && (
            <Link
              href="/cuenta"
              className="border-warning/40 bg-warning/10 mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium print:hidden"
            >
              <KeyRound className="text-warning size-4 shrink-0" />
              Estás usando una contraseña temporal. Toca aquí para cambiarla.
            </Link>
          )}
          {children}
        </main>
      </div>

      <MenuInferior secciones={secciones} registrosRapidos={registrosRapidos} />
    </div>
  );
}
