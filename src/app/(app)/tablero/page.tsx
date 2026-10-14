import { requierePermiso } from "@/lib/sesion";
import { ETIQUETA_ROL } from "@/lib/permisos";
import { cerrarSesion } from "@/app/sesion/acciones";
import { Button } from "@/components/ui/button";

export default async function Tablero() {
  const usuario = await requierePermiso("tablero:ver");
  return (
    <main className="p-6">
      <h1 className="text-3xl font-semibold">Tablero</h1>
      <p className="text-muted-foreground">
        {usuario.nombre} · {ETIQUETA_ROL[usuario.rol]}
      </p>
      <form action={cerrarSesion} className="mt-4">
        <Button variant="outline">Cerrar sesión</Button>
      </form>
    </main>
  );
}
