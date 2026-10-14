"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function desplazar(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1 + delta, 1));
  return f.toISOString().slice(0, 7);
}

/** Selector de mes que navega con ?mes=AAAA-MM. */
export function SelectorMes({ mes, ruta }: { mes: string; ruta: string }) {
  const router = useRouter();
  const ir = (m: string) => router.push(`${ruta}?mes=${m}`);
  return (
    <div className="mb-4 flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Mes anterior"
        onClick={() => ir(desplazar(mes, -1))}
      >
        <ChevronLeft />
      </Button>
      <Input
        type="month"
        value={mes}
        aria-label="Mes"
        className="w-44"
        onChange={(e) => e.target.value && ir(e.target.value)}
      />
      <Button
        variant="outline"
        size="icon"
        aria-label="Mes siguiente"
        onClick={() => ir(desplazar(mes, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
