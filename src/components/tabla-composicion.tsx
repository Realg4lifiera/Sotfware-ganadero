import Link from "next/link";
import type { FilaComposicion } from "@/lib/dominio/categoria";
import { formatoNumero, formatoPorcentaje } from "@/lib/formato";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Composición del hato por categoría: cantidad, % real y % ideal configurable. */
export function TablaComposicion({
  titulo,
  filas,
  total,
  conIdeal,
}: {
  titulo: string;
  filas: FilaComposicion[];
  total: number;
  conIdeal: boolean;
}) {
  return (
    <Table className="[&_td]:px-2 sm:[&_td]:px-4 [&_th]:px-2 sm:[&_th]:px-4">
      <TableHeader>
        <TableRow>
          <TableHead>{titulo}</TableHead>
          {/* En celular, encabezados cortos para que quepan las cuatro columnas. */}
          <TableHead className="text-right">
            <span className="sm:hidden">Cant.</span>
            <span className="hidden sm:inline">Cantidad</span>
          </TableHead>
          <TableHead className="text-right">
            <span className="sm:hidden">Real</span>
            <span className="hidden sm:inline">% actual</span>
          </TableHead>
          {conIdeal && (
            <TableHead className="text-right">
              <span className="sm:hidden">Ideal</span>
              <span className="hidden sm:inline">% ideal</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((f) => {
          const desviado =
            conIdeal &&
            f.porcentajeIdeal !== null &&
            Math.abs(f.porcentajeReal - f.porcentajeIdeal) > 0.1;
          return (
            <TableRow key={f.categoria}>
              <TableCell>
                <Link
                  href={`/animales?categoria=${f.categoria}`}
                  className="hover:text-primary font-medium hover:underline"
                >
                  {f.etiqueta}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatoNumero(f.cantidad)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatoPorcentaje(f.porcentajeReal, 0)}
              </TableCell>
              {conIdeal && (
                <TableCell className="text-right tabular-nums">
                  <span
                    className={desviado ? "text-warning font-semibold" : "text-muted-foreground"}
                  >
                    {formatoPorcentaje(f.porcentajeIdeal, 0)}
                  </span>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="text-right tabular-nums">{formatoNumero(total)}</TableCell>
          <TableCell colSpan={conIdeal ? 2 : 1} />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
