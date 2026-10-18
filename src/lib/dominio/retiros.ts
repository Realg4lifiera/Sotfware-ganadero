/**
 * Animales en retiro de leche o de carne (función pura). Un evento sanitario aplica a un
 * animal o a un lote; si es a un lote, cubre a los animales que estaban en él ese día.
 */

export interface EventoRetiro {
  fecha: Date;
  producto: string;
  animalId: string | null;
  loteId: string | null;
  retiroLecheHasta: Date | null;
  retiroCarneHasta: Date | null;
}

export interface Retiro {
  animalId: string;
  lecheHasta: Date | null;
  carneHasta: Date | null;
  productos: string[];
}

/**
 * @param animalesDelLote ids de los animales de cada lote al momento del evento
 *   (se usa el lote actual: los retiros duran días y los traslados son raros).
 */
export function animalesEnRetiro(
  eventos: EventoRetiro[],
  animalesDelLote: Map<string, string[]>,
  hoy: Date,
): Retiro[] {
  const m = new Map<string, Retiro>();
  const vigente = (f: Date | null) => (f && f >= hoy ? f : null);
  const mayor = (a: Date | null, b: Date | null) => (!a ? b : !b ? a : a > b ? a : b);
  for (const e of eventos) {
    const leche = vigente(e.retiroLecheHasta);
    const carne = vigente(e.retiroCarneHasta);
    if (!leche && !carne) continue;
    const ids = e.animalId ? [e.animalId] : (animalesDelLote.get(e.loteId ?? "") ?? []);
    for (const id of ids) {
      const r = m.get(id) ?? { animalId: id, lecheHasta: null, carneHasta: null, productos: [] };
      r.lecheHasta = mayor(r.lecheHasta, leche);
      r.carneHasta = mayor(r.carneHasta, carne);
      if (!r.productos.includes(e.producto)) r.productos.push(e.producto);
      m.set(id, r);
    }
  }
  return [...m.values()];
}
