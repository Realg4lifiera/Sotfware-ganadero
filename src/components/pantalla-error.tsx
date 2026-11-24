"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Pantalla de error inesperado (error.tsx). En producción el mensaje real no llega al
 * navegador; se muestra uno útil para el campo y el código (`digest`) para buscarlo en
 * los registros de Vercel.
 */
export function PantallaError({
  error,
  retry,
  inicio = "/tablero",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  inicio?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <TriangleAlert className="text-warning size-12" />
      <h1 className="text-2xl font-semibold">No se pudo cargar esta pantalla</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Puede ser la conexión a internet o la base de datos. Revisa la señal y vuelve a intentarlo;
        si sigue fallando, avisa al administrador.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>
          <RotateCw /> Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link href={inicio}>Ir al inicio</Link>
        </Button>
      </div>
      {error.digest && (
        <p className="text-muted-foreground text-xs">Código del error: {error.digest}</p>
      )}
    </div>
  );
}
