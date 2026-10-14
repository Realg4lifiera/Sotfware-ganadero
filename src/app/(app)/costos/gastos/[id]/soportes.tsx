"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { eliminarGasto, eliminarSoporte, subirSoporte } from "../acciones";

interface Adjunto {
  id: string;
  nombre: string;
  url: string;
  esImagen: boolean;
}

export function Soportes({
  gastoId,
  adjuntos,
  puedeSubir,
  puedeQuitar,
}: {
  gastoId: string;
  adjuntos: Adjunto[];
  puedeSubir: boolean;
  puedeQuitar: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pendiente, iniciar] = useTransition();
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="size-5" /> Soportes ({adjuntos.length})
        </CardTitle>
        {puedeSubir && (
          <>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                e.target.value = "";
                if (!archivo) return;
                iniciar(async () => {
                  const datos = new FormData();
                  datos.set("archivo", archivo);
                  const r = await subirSoporte(gastoId, datos);
                  if (r.ok) {
                    toast.success("Soporte agregado.");
                    router.refresh();
                  } else toast.error(r.error);
                });
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={pendiente}
              onClick={() => input.current?.click()}
            >
              <Upload /> {pendiente ? "Subiendo…" : "Agregar"}
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent>
        {adjuntos.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Sin soportes. Puedes agregar la foto o el PDF de la factura.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {adjuntos.map((a) => (
              <li
                key={a.id}
                className="group bg-muted/40 relative overflow-hidden rounded-lg border"
              >
                <a href={a.url} target="_blank" rel="noopener" className="block">
                  {a.esImagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt={a.nombre} className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <span className="flex aspect-[4/3] items-center justify-center">
                      <FileText className="text-muted-foreground size-10" />
                    </span>
                  )}
                  <span className="block truncate px-2 py-1.5 text-xs">{a.nombre}</span>
                </a>
                {puedeQuitar && (
                  <button
                    type="button"
                    aria-label={`Quitar ${a.nombre}`}
                    className="bg-card/90 text-destructive absolute top-1.5 right-1.5 rounded-md p-1.5 shadow-sm"
                    onClick={() =>
                      iniciar(async () => {
                        const r = await eliminarSoporte(a.id);
                        if (r.ok) {
                          toast.success("Soporte quitado.");
                          router.refresh();
                        } else toast.error(r.error);
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function BotonEliminarGasto({ id }: { id: string }) {
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
            <DialogTitle>¿Eliminar este gasto?</DialogTitle>
            <DialogDescription>
              Deja de contar en los costos. El registro queda en la auditoría.
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
                  const r = await eliminarGasto(id);
                  if (r.ok) {
                    toast.success("Gasto eliminado.");
                    router.push("/costos/gastos");
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
