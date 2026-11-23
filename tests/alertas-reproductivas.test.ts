import { describe, expect, it } from "vitest";
import { alertasReproductivas, type SituacionAlerta } from "@/lib/dominio/alertas-reproductivas";
import { configuracionReproduccionSchema } from "@/lib/dominio/categoria";

const config = configuracionReproduccionSchema.parse({});
const hoy = new Date("2026-10-18T00:00:00Z");
const hace = (d: number) => new Date(hoy.getTime() - d * 86_400_000);
const en = (d: number) => new Date(hoy.getTime() + d * 86_400_000);

const vaca = (s: Partial<SituacionAlerta>): SituacionAlerta => ({
  id: "v1",
  numero: "101",
  nombre: "Lola",
  estado: "VACIA",
  lactanciaAbierta: false,
  ultimoParto: null,
  ultimoServicio: null,
  serviciosCiclo: 0,
  diagnosticadaTrasServicio: false,
  fechaProbableParto: null,
  ...s,
});
const tipos = (s: Partial<SituacionAlerta>) =>
  alertasReproductivas([vaca(s)], config, hoy).map((a) => `${a.tipo}: ${a.detalle}`);

describe("alertasReproductivas", () => {
  it("parto próximo dentro de la ventana y atrasado", () => {
    expect(tipos({ estado: "SECA", fechaProbableParto: en(12) })).toEqual([
      "PARTO_PROXIMO: Parto en 12 días",
    ]);
    expect(tipos({ estado: "SECA", fechaProbableParto: en(31) })).toEqual([]);
    expect(tipos({ estado: "SECA", fechaProbableParto: hace(2) })).toEqual([
      "PARTO_PROXIMO: Parto atrasado 2 días",
    ]);
  });

  it("vaca por secar: preñada en producción a 60 días o menos del parto", () => {
    expect(
      tipos({ estado: "PRENADA", lactanciaAbierta: true, fechaProbableParto: en(61) }),
    ).toEqual([]);
    expect(
      tipos({ estado: "PRENADA", lactanciaAbierta: true, fechaProbableParto: en(60) }),
    ).toEqual(["POR_SECAR: Secar hoy"]);
    expect(
      tipos({ estado: "PRENADA", lactanciaAbierta: true, fechaProbableParto: en(50) }),
    ).toEqual(["POR_SECAR: Secado atrasado 10 días · parto en 50 días"]);
    // Seca o sin lactancia: no hay que secarla.
    expect(
      tipos({ estado: "PRENADA", lactanciaAbierta: false, fechaProbableParto: en(50) }),
    ).toEqual([]);
  });

  it("pendiente de diagnóstico desde 35 días sin diagnóstico posterior", () => {
    expect(tipos({ estado: "SERVIDA", ultimoServicio: hace(34) })).toEqual([]);
    expect(tipos({ estado: "SERVIDA", ultimoServicio: hace(36) })).toEqual([
      "PENDIENTE_DIAGNOSTICO: Servida hace 36 días",
    ]);
    expect(
      tipos({ estado: "SERVIDA", ultimoServicio: hace(36), diagnosticadaTrasServicio: true }),
    ).toEqual([]);
  });

  it("celo esperado alrededor de los 21 y 42 días", () => {
    expect(tipos({ estado: "SERVIDA", ultimoServicio: hace(15) })).toEqual([]);
    expect(tipos({ estado: "SERVIDA", ultimoServicio: hace(20) })).toEqual([
      "CELO_ESPERADO: Día 20 desde el servicio: observar repetición de celo",
    ]);
    expect(tipos({ estado: "SERVIDA", ultimoServicio: hace(30) })).toEqual([]);
    expect(tipos({ estado: "SERVIDA", ultimoServicio: hace(42) })).toEqual([
      "PENDIENTE_DIAGNOSTICO: Servida hace 42 días",
      "CELO_ESPERADO: Día 42 desde el servicio: observar repetición de celo",
    ]);
  });

  it("vacías con más de 120 días abiertos y repetidoras", () => {
    expect(tipos({ estado: "PARIDA", ultimoParto: hace(120) })).toEqual([]);
    expect(tipos({ estado: "VACIA", ultimoParto: hace(150), serviciosCiclo: 3 })).toEqual([
      "VACIA_LARGA: 150 días abiertos · 3 servicios",
      "REPETIDORA: 3 servicios sin preñez en el ciclo · evaluar descarte",
    ]);
    // Preñada no es vacía larga aunque haya parido hace mucho.
    expect(tipos({ estado: "PRENADA", ultimoParto: hace(200), serviciosCiclo: 3 })).toEqual([]);
  });
});
