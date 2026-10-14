import { describe, expect, it } from "vitest";
import { reporteManoObra, totalesNomina } from "@/lib/dominio/nomina";

describe("nómina", () => {
  it("suma el costo total de un pago con prestaciones", () => {
    const t = totalesNomina({
      salario: 2175000,
      auxilioTransporte: 200000,
      salud: 184875,
      pension: 261000,
      arl: 11354.85,
      prima: 197847.5,
      vacaciones: 90697.5,
      cesantias: 197847.5,
      interesesCesantias: 23741.7,
      bonificacion: 0,
    });
    expect(t.seguridadSocial).toBe(457229.85);
    expect(t.prestaciones).toBe(510134.2);
    expect(t.costoTotal).toBe(3342364.05);
  });

  it("un contrato sin prestaciones es solo el salario", () => {
    expect(totalesNomina({ salario: 360000 }).costoTotal).toBe(360000);
  });

  it("arma el reporte mensual (empleados únicos)", () => {
    const r = reporteManoObra([
      { trabajadorId: "t1", salario: 2175000, bonificacion: 50000 },
      { trabajadorId: "t1", salario: 1000000 },
      { trabajadorId: "t2", salario: 360000, prima: 30000 },
    ]);
    expect(r).toMatchObject({
      empleados: 2,
      pagos: 3,
      salarios: 3535000,
      bonificaciones: 50000,
      prestaciones: 30000,
      costoTotal: 3615000,
    });
  });
});
