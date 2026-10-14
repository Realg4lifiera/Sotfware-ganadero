/**
 * Totales de una compra (formato "Ingresar compra" de Colanta):
 *   subtotal = cantidad × valor unitario
 *   base     = subtotal − descuento
 *   IVA      = base × % IVA
 *   total    = base + IVA            (lo que se pagó)
 *   costo    = total, o base si el IVA no es costo (configurable en Finca)
 * Se calcula en centavos y se redondea a 2 decimales (pesos con centavos).
 */
export interface DatosCompra {
  cantidad: number;
  valorUnitario: number;
  descuento?: number;
  ivaPorcentaje?: number;
}

export interface TotalesCompra {
  subtotal: number;
  descuento: number;
  base: number;
  valorIva: number;
  total: number;
}

const aCentavos = (n: number) => Math.round((n + Number.EPSILON) * 100);
const dePesos = (c: number) => c / 100;

export function calcularCompra(d: DatosCompra): TotalesCompra {
  const subtotal = aCentavos(d.cantidad * d.valorUnitario);
  const descuento = aCentavos(d.descuento ?? 0);
  const base = subtotal - descuento;
  const valorIva = Math.round((base * (d.ivaPorcentaje ?? 0)) / 100);
  return {
    subtotal: dePesos(subtotal),
    descuento: dePesos(descuento),
    base: dePesos(base),
    valorIva: dePesos(valorIva),
    total: dePesos(base + valorIva),
  };
}

/** Valor que entra al costo según la configuración de la finca. */
export function costoDeCompra(
  g: { valorTotal: number; valorIva: number },
  ivaEsCosto: boolean,
): number {
  return ivaEsCosto ? g.valorTotal : dePesos(aCentavos(g.valorTotal) - aCentavos(g.valorIva));
}
