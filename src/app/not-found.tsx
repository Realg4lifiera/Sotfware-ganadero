import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <SearchX className="text-muted-foreground size-12" />
      <h1 className="text-3xl font-semibold">Página no encontrada</h1>
      <p className="text-muted-foreground max-w-md">
        El registro o la página que buscas no existe.
      </p>
      <Button asChild>
        <Link href="/tablero">Ir al tablero</Link>
      </Button>
    </main>
  );
}
