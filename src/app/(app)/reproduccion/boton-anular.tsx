"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { anularUltimoEvento } from "./acciones";

/** Anula el último evento reproductivo de la hembra (con confirmación). */
export function BotonAnular({
  hembraId,
  descripcion,
  compacto = false,
}: {
  hembraId: string;
  descripcion: string;
  compacto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button
        variant="ghost"
        size={compacto ? "sm" : "default"}
        className="text-destructive"
        onClick={() => setAbierto(true)}
      >
        <Undo2 /> Anular
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Anular este evento?</DialogTitle>
            <DialogDescription>
              {descripcion} La hembra vuelve al estado que tenía antes. Solo se puede anular el
              último evento de cada hembra.
            </DialogDescription>
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
                  const r = await anularUltimoEvento(hembraId);
                  if (!r.ok) return void toast.error(r.error);
                  toast.success(`${r.datos} anulado.`);
                  setAbierto(false);
                  router.refresh();
                })
              }
            >
              {pendiente ? "Anulando…" : "Anular evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
