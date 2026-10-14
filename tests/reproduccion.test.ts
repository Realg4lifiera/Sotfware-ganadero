import { describe, expect, it } from "vitest";
import {
  aplicarEvento,
  ErrorTransicion,
  eventosPermitidos,
  reproducirHistorial,
  type EventoReproductivo,
  type SituacionHembra,
} from "@/lib/dominio/reproduccion";
import type { EstadoReproductivo } from "@/generated/prisma/enums";

const ESTADOS: EstadoReproductivo[] = ["NOVILLA", "VACIA", "SERVIDA", "PRENADA", "SECA", "PARIDA"];
const sit = (
  estado: EstadoReproductivo,
  numeroPartos = 2,
  lactanciaAbierta = false,
): SituacionHembra => ({
  estado,
  numeroPartos,
  lactanciaAbierta,
});
const ev = {
  celo: { tipo: "CELO" },
  servicio: { tipo: "SERVICIO" },
  dxPositivo: { tipo: "DIAGNOSTICO", resultado: "PRENADA" },
  dxNegativo: { tipo: "DIAGNOSTICO", resultado: "VACIA" },
  parto: { tipo: "PARTO" },
  aborto: { tipo: "ABORTO" },
  secado: { tipo: "SECADO" },
  descarte: { tipo: "DESCARTE" },
} satisfies Record<string, EventoReproductivo>;

/**
 * Tabla completa: estado de origen (con 2 partos) → resultado de cada evento.
 * "error" = transición no permitida. Para el secado se asume lactancia abierta.
 */
const TABLA: Record<EstadoReproductivo, Record<keyof typeof ev, EstadoReproductivo | "error">> = {
  NOVILLA: {
    celo: "NOVILLA",
    servicio: "SERVIDA",
    dxPositivo: "PRENADA",
    dxNegativo: "NOVILLA",
    parto: "error",
    aborto: "error",
    secado: "error",
    descarte: "NOVILLA",
  },
  VACIA: {
    celo: "VACIA",
    servicio: "SERVIDA",
    dxPositivo: "PRENADA",
    dxNegativo: "VACIA",
    parto: "error",
    aborto: "error",
    secado: "VACIA",
    descarte: "VACIA",
  },
  SERVIDA: {
    celo: "SERVIDA",
    servicio: "SERVIDA",
    dxPositivo: "PRENADA",
    dxNegativo: "VACIA",
    parto: "error",
    aborto: "error",
    secado: "SERVIDA",
    descarte: "SERVIDA",
  },
  PRENADA: {
    celo: "PRENADA",
    servicio: "error",
    dxPositivo: "PRENADA",
    dxNegativo: "VACIA",
    parto: "PARIDA",
    aborto: "VACIA",
    secado: "SECA",
    descarte: "PRENADA",
  },
  SECA: {
    celo: "SECA",
    servicio: "error",
    dxPositivo: "SECA",
    dxNegativo: "error",
    parto: "PARIDA",
    aborto: "VACIA",
    secado: "error",
    descarte: "SECA",
  },
  PARIDA: {
    celo: "PARIDA",
    servicio: "SERVIDA",
    dxPositivo: "PRENADA",
    dxNegativo: "PARIDA",
    parto: "error",
    aborto: "error",
    secado: "VACIA",
    descarte: "PARIDA",
  },
};

describe("máquina de estados reproductiva: tabla completa", () => {
  for (const estado of ESTADOS) {
    for (const [nombre, evento] of Object.entries(ev) as [keyof typeof ev, EventoReproductivo][]) {
      const esperado = TABLA[estado][nombre];
      it(`${estado} + ${nombre} → ${esperado}`, () => {
        const h = sit(estado, 2, nombre === "secado" || estado === "PARIDA");
        if (esperado === "error") {
          expect(() => aplicarEvento(h, evento)).toThrow(ErrorTransicion);
        } else {
          expect(aplicarEvento(h, evento).estado).toBe(esperado);
        }
      });
    }
  }
});

describe("reglas particulares", () => {
  it("sin partos, el diagnóstico negativo y el aborto vuelven a NOVILLA", () => {
    expect(aplicarEvento(sit("SERVIDA", 0), ev.dxNegativo).estado).toBe("NOVILLA");
    expect(aplicarEvento(sit("PRENADA", 0), ev.dxNegativo).estado).toBe("NOVILLA");
    expect(aplicarEvento(sit("PRENADA", 0), ev.aborto).estado).toBe("NOVILLA");
    expect(aplicarEvento(sit("SECA", 1), ev.aborto).estado).toBe("VACIA");
  });

  it("el parto suma un parto y abre lactancia; cierra la anterior si no se secó", () => {
    expect(aplicarEvento(sit("SECA", 2, false), ev.parto)).toEqual({
      estado: "PARIDA",
      numeroPartos: 3,
      abrirLactancia: true,
      cerrarLactancia: false,
      sinCambio: false,
    });
    expect(aplicarEvento(sit("PRENADA", 0, false), ev.parto).numeroPartos).toBe(1);
    expect(aplicarEvento(sit("PRENADA", 2, true), ev.parto)).toMatchObject({
      abrirLactancia: true,
      cerrarLactancia: true,
    });
  });

  it("el secado exige lactancia abierta y la cierra", () => {
    expect(() => aplicarEvento(sit("PRENADA", 2, false), ev.secado)).toThrow(
      /no tiene una lactancia abierta/,
    );
    expect(aplicarEvento(sit("PRENADA", 2, true), ev.secado)).toMatchObject({
      estado: "SECA",
      cerrarLactancia: true,
    });
    expect(aplicarEvento(sit("SERVIDA", 2, true), ev.secado)).toMatchObject({
      estado: "SERVIDA",
      cerrarLactancia: true,
    });
  });

  it("celo, descarte y reconfirmaciones no cambian nada", () => {
    expect(aplicarEvento(sit("VACIA"), ev.celo).sinCambio).toBe(true);
    expect(aplicarEvento(sit("PRENADA"), ev.descarte).sinCambio).toBe(true);
    expect(aplicarEvento(sit("PRENADA"), ev.dxPositivo).sinCambio).toBe(true);
    expect(aplicarEvento(sit("VACIA"), ev.dxNegativo).sinCambio).toBe(true);
    expect(aplicarEvento(sit("SERVIDA"), ev.servicio).sinCambio).toBe(false); // repetición de servicio
  });

  it("los mensajes de error están en español", () => {
    expect(() => aplicarEvento(sit("PRENADA"), ev.servicio)).toThrow(
      "La hembra está preñada: no se puede registrar un servicio.",
    );
    expect(() => aplicarEvento(sit("SECA"), ev.servicio)).toThrow(/está seca y preñada/);
    expect(() => aplicarEvento(sit("VACIA"), ev.parto)).toThrow(
      "Solo una hembra preñada o seca puede parir (está vacía).",
    );
    expect(() => aplicarEvento(sit("SECA"), ev.dxNegativo)).toThrow(/registra un aborto/);
  });
});

describe("eventos permitidos e historial", () => {
  it("lista solo los eventos válidos", () => {
    const tipos = (h: SituacionHembra) =>
      eventosPermitidos(h).map((e) => (e.tipo === "DIAGNOSTICO" ? `DX_${e.resultado}` : e.tipo));
    expect(tipos(sit("PRENADA", 2, true))).toEqual([
      "CELO",
      "DX_PRENADA",
      "DX_VACIA",
      "PARTO",
      "ABORTO",
      "SECADO",
      "DESCARTE",
    ]);
    expect(tipos(sit("NOVILLA", 0, false))).toEqual([
      "CELO",
      "SERVICIO",
      "DX_PRENADA",
      "DX_VACIA",
      "DESCARTE",
    ]);
  });

  it("reproduce el ciclo completo de una novilla hasta su segunda lactancia", () => {
    const final = reproducirHistorial(sit("NOVILLA", 0, false), [
      ev.celo,
      ev.servicio,
      ev.dxNegativo, // vuelve a novilla
      ev.servicio,
      ev.dxPositivo,
      ev.parto, // 1.er parto: parida, en producción
      ev.servicio,
      ev.dxPositivo, // preñada y en producción
      ev.secado, // seca
      ev.parto, // 2.º parto
    ]);
    expect(final).toEqual({ estado: "PARIDA", numeroPartos: 2, lactanciaAbierta: true });
  });

  it("indica qué evento del historial no procede", () => {
    expect(() => reproducirHistorial(sit("NOVILLA", 0), [ev.servicio, ev.parto])).toThrow(
      /^Evento 2 \(parto\): Solo una hembra preñada/,
    );
  });
});
