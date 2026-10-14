"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ResultadoAccion } from "@/lib/errores";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Botón con confirmación para eliminar (borrado lógico) un registro. */
export function BotonEliminar({
  accion,
  titulo,
  descripcion,
  destino,
}: {
  accion: () => Promise<ResultadoAccion<unknown>>;
  titulo: string;
  descripcion: string;
  destino: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button variant="ghost" className="text-destructive" onClick={() => setAbierto(true)}>
        <Trash2 /> Eliminar
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>{descripcion}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pendiente}
              onClick={() =>
                iniciar(async () => {
                  const r = await accion();
                  if (r.ok) {
                    toast.success("Eliminado.");
                    router.push(destino);
                    router.refresh();
                  } else toast.error(r.error);
                })
              }
            >
              <Trash2 /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
