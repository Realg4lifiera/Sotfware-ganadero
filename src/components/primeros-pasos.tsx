import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, Rocket } from "lucide-react";
import type { PasoInicial } from "@/lib/servicios/primeros-pasos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Guía para dejar lista una finca nueva; desaparece cuando todos los pasos están hechos. */
export function PrimerosPasos({ pasos }: { pasos: PasoInicial[] }) {
  const obligatorios = pasos.filter((p) => !p.opcional);
  if (obligatorios.every((p) => p.hecho)) return null;
  const hechos = obligatorios.filter((p) => p.hecho).length;
  const siguiente = pasos.find((p) => !p.hecho);
  return (
    <Card className="border-primary/40 mb-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="text-primary size-5" /> Primeros pasos
        </CardTitle>
        <CardDescription>
          {hechos} de {obligatorios.length} listos. Con esto la finca queda lista para registrar el
          día a día.
        </CardDescription>
        <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${(hechos / obligatorios.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <ol className="divide-y border-t">
          {pasos.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className={`hover:bg-muted/40 flex items-center gap-3 px-6 py-3 ${
                  p === siguiente ? "bg-primary/5" : ""
                }`}
              >
                {p.hecho ? (
                  <CheckCircle2 className="text-success size-5 shrink-0" aria-label="Listo" />
                ) : (
                  <Circle
                    className="text-muted-foreground size-5 shrink-0"
                    aria-label="Pendiente"
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={`font-semibold ${p.hecho ? "text-muted-foreground line-through" : ""}`}
                  >
                    {p.titulo}
                    {p.opcional && (
                      <span className="text-muted-foreground font-normal"> (opcional)</span>
                    )}
                  </span>
                  {!p.hecho && (
                    <span className="text-muted-foreground text-xs">{p.descripcion}</span>
                  )}
                </span>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
