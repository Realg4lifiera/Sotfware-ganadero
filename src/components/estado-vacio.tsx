import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EstadoVacio({
  titulo,
  descripcion,
  icono: IconoVacio = Inbox,
  children,
  className,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  icono?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card/50 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <IconoVacio className="text-muted-foreground size-9" />
      <p className="font-semibold">{titulo}</p>
      {descripcion && <p className="text-muted-foreground max-w-md text-sm">{descripcion}</p>}
      {children}
    </div>
  );
}
