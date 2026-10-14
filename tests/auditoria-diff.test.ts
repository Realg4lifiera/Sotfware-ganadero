import { describe, expect, it } from "vitest";
import { diferencias, serializar } from "@/lib/auditoria-diff";

describe("auditoría: serialización y diferencias", () => {
  it("oculta la contraseña y serializa fechas y decimales", () => {
    const decimal = { toJSON: () => "12.50" };
    const r = serializar({
      id: "x",
      passwordHash: "secreto",
      fecha: new Date("2025-02-14T00:00:00Z"),
      litros: decimal,
      nota: undefined,
    });
    expect(r).toEqual({ id: "x", fecha: "2025-02-14T00:00:00.000Z", litros: "12.50", nota: null });
  });

  it("devuelve solo los campos que cambiaron", () => {
    const [a, d] = diferencias(
      { id: "1", nombre: "Lucero", loteId: "L1", updatedAt: "t1", updatedById: "u1" },
      { id: "1", nombre: "Lucero", loteId: "L2", updatedAt: "t2", updatedById: "u2" },
    );
    expect(a).toEqual({ loteId: "L1" });
    expect(d).toEqual({ loteId: "L2" });
  });
});
