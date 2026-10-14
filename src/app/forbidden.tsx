import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SinPermiso() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlert className="text-warning size-12" />
      <h1 className="text-3xl font-semibold">No tienes permiso</h1>
      <p className="text-muted-foreground max-w-md">
        Tu rol no tiene acceso a esta sección. Si crees que es un error, habla con el administrador
        de la finca.
      </p>
      <Button asChild>
        <Link href="/tablero">Volver al tablero</Link>
      </Button>
    </main>
  );
}
