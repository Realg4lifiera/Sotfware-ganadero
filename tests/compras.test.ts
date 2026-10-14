import { describe, expect, it } from "vitest";
import { calcularCompra, costoDeCompra } from "@/lib/dominio/compras";

describe("totales de compra", () => {
  it("reproduce una compra del Excel de Colanta (forraje de maíz, IVA 5 %)", () => {
    // FORRAJE DE MAIZ X 50KG: 10 × 28.420, IVA 5 % → IVA 14.210, total 298.410
    expect(calcularCompra({ cantidad: 10, valorUnitario: 28420, ivaPorcentaje: 5 })).toEqual({
      subtotal: 284200,
      descuento: 0,
      base: 284200,
      valorIva: 14210,
      total: 298410,
    });
  });

  it("aplica el descuento antes del IVA", () => {
    // FERT. SELEC. CON LEVADURAS: 12 × 82.619 = 991.428, descuento 19.829 → base 971.599
    const r = calcularCompra({
      cantidad: 12,
      valorUnitario: 82619,
      descuento: 19829,
      ivaPorcentaje: 5,
    });
    expect(r.base).toBe(971599);
    expect(r.valorIva).toBe(48579.95);
    expect(r.total).toBe(1020178.95);
  });

  it("maneja cantidades decimales y redondea a centavos", () => {
    expect(calcularCompra({ cantidad: 2.5, valorUnitario: 1999.99 }).total).toBe(4999.98);
    expect(calcularCompra({ cantidad: 1, valorUnitario: 0.1 + 0.2 }).total).toBe(0.3);
  });

  it("el costo incluye o excluye el IVA según la configuración", () => {
    const g = { valorTotal: 298410, valorIva: 14210 };
    expect(costoDeCompra(g, true)).toBe(298410);
    expect(costoDeCompra(g, false)).toBe(284200);
  });
});
