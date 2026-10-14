import { Card, CardContent } from "@/components/ui/card";

/** Tarjeta pequeña de un total (montos del mes, conteos…). */
export function TarjetaResumen({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs font-semibold">{titulo}</p>
        <p className="font-display text-2xl font-semibold tabular-nums">{valor}</p>
        {detalle && <p className="text-muted-foreground text-xs">{detalle}</p>}
      </CardContent>
    </Card>
  );
}
