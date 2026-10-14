import { Beef } from "lucide-react";
import { cn } from "@/lib/utils";

/** Miniatura de la foto del animal (o un ícono si no tiene). */
export function FotoAnimal({
  url,
  sexo,
  className,
}: {
  url: string | null;
  sexo?: string;
  className?: string;
}) {
  if (!url) {
    return (
      <span
        className={cn(
          "bg-accent text-accent-foreground flex shrink-0 items-center justify-center rounded-lg",
          sexo === "MACHO" && "bg-secondary",
          className,
        )}
        aria-hidden
      >
        <Beef className="size-1/2" />
      </span>
    );
  }
  return (
    // Archivo privado servido por /api/archivos (requiere sesión): no pasa por next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      className={cn("shrink-0 rounded-lg object-cover", className)}
    />
  );
}
