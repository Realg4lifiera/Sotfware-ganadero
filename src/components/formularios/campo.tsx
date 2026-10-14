import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Envoltura de un control de formulario con etiqueta, ayuda y mensaje de error. */
export function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  requerido,
  className,
  children,
}: {
  id: string;
  etiqueta: React.ReactNode;
  error?: string;
  ayuda?: React.ReactNode;
  requerido?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {etiqueta}
        {requerido && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {ayuda && <p className="text-muted-foreground text-xs">{ayuda}</p>}
      {error && <p className="text-destructive text-xs font-medium">{error}</p>}
    </div>
  );
}
