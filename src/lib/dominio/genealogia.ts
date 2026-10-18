/**
 * Alerta de consanguinidad al servir (función pura). No bloquea el servicio: avisa para
 * que el veterinario decida. Se revisan parentescos cercanos con los datos registrados.
 */

export interface HembraGenealogia {
  id: string;
  madreId: string | null;
  /** Toro padre de la hembra. */
  padreToroId: string | null;
  /** Toro padre de la madre (abuelo materno). */
  abueloMaternoToroId: string | null;
}

export interface ToroGenealogia {
  id: string;
  /** Si el toro es del hato: su madre y su padre (toro). */
  madreId: string | null;
  padreToroId: string | null;
}

export function alertasConsanguinidad(h: HembraGenealogia, t: ToroGenealogia): string[] {
  const alertas: string[] = [];
  if (h.padreToroId === t.id) alertas.push("El toro es el padre de la hembra.");
  if (h.abueloMaternoToroId === t.id) alertas.push("El toro es el abuelo materno de la hembra.");
  if (t.madreId && t.madreId === h.id) alertas.push("El toro es hijo de la hembra.");
  if (t.madreId && h.madreId && t.madreId === h.madreId)
    alertas.push("El toro y la hembra son hijos de la misma vaca.");
  if (t.padreToroId && h.padreToroId && t.padreToroId === h.padreToroId)
    alertas.push("El toro y la hembra son hijos del mismo toro.");
  return alertas;
}
