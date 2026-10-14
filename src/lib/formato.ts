/**
 * Formato de números, dinero y unidades en es-CO.
 * Acepta number, string o cualquier objeto con toString() (p. ej. Prisma.Decimal).
 */
type Numerico = number | string | { toString(): string } | null | undefined;

function aNumero(valor: Numerico): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = typeof valor === "number" ? valor : Number(valor.toString());
  return Number.isFinite(n) ? n : null;
}

const formatosNumero = new Map<string, Intl.NumberFormat>();
function formateador(min: number, max: number) {
  const clave = `${min}-${max}`;
  let f = formatosNumero.get(clave);
  if (!f) {
    f = new Intl.NumberFormat("es-CO", { minimumFractionDigits: min, maximumFractionDigits: max });
    formatosNumero.set(clave, f);
  }
  return f;
}

/** 1250000 → "1.250.000"; 12.5 → "12,5" */
export function formatoNumero(valor: Numerico, decimales = 2, minDecimales = 0): string {
  const n = aNumero(valor);
  if (n === null) return "—";
  return formateador(minDecimales, decimales).format(n);
}

/** 1250000 → "$ 1.250.000"; los centavos solo se muestran si existen. */
export function formatoCOP(valor: Numerico): string {
  const n = aNumero(valor);
  if (n === null) return "—";
  const signo = n < 0 ? "-" : "";
  return `${signo}$ ${formateador(0, 2).format(Math.abs(n))}`;
}

/** 12.5 → "12,5 L" */
export function formatoLitros(valor: Numerico): string {
  const n = aNumero(valor);
  return n === null ? "—" : `${formateador(0, 2).format(n)} L`;
}

/** 450 → "450 kg" */
export function formatoKg(valor: Numerico): string {
  const n = aNumero(valor);
  return n === null ? "—" : `${formateador(0, 2).format(n)} kg`;
}

/** 0.128 → "12,8 %" */
export function formatoPorcentaje(fraccion: Numerico, decimales = 1): string {
  const n = aNumero(fraccion);
  return n === null ? "—" : `${formateador(0, decimales).format(n * 100)} %`;
}

/**
 * Convierte texto escrito por el usuario en formato colombiano a número.
 * "1.250.000" → 1250000 ; "12,5" → 12.5 ; "1.250,75" → 1250.75 ; "12.5" → 12.5
 */
export function parsearNumeroCO(texto: string): number | null {
  const limpio = texto.replace(/[$\s]/g, "").trim();
  if (limpio === "") return null;
  let normalizado: string;
  if (limpio.includes(",")) {
    normalizado = limpio.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(limpio)) {
    // Solo puntos agrupando de a tres: separadores de miles.
    normalizado = limpio.replace(/\./g, "");
  } else {
    normalizado = limpio;
  }
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}
