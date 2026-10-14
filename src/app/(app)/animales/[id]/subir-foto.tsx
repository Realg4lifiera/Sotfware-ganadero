"use client";

import { useRef, useTransition } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { subirFotoAnimal } from "../acciones";

const LADO_MAXIMO = 1600;

/** Reduce la foto en el navegador (menos datos en conexiones rurales). */
async function reducirImagen(archivo: File): Promise<File> {
  if (!archivo.type.startsWith("image/")) return archivo;
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && archivo.size < 1_000_000 && archivo.type === "image/jpeg") return archivo;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : archivo;
  } catch {
    return archivo; // formatos que el navegador no decodifica: el servidor los valida
  }
}

export function SubirFoto({ animalId, tieneFoto }: { animalId: string; tieneFoto: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          e.target.value = "";
          if (!archivo) return;
          iniciar(async () => {
            const datos = new FormData();
            datos.set("foto", await reducirImagen(archivo));
            const r = await subirFotoAnimal(animalId, datos);
            if (r.ok) toast.success("Foto actualizada.");
            else toast.error(r.error);
          });
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={pendiente}
        onClick={() => input.current?.click()}
      >
        <Camera /> {pendiente ? "Subiendo…" : tieneFoto ? "Cambiar foto" : "Agregar foto"}
      </Button>
    </>
  );
}
