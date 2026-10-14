"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/accion";
import { CAMPOS_FINCA, CAMPOS_HATO } from "@/lib/catalogos/finca";
import {
  CATEGORIAS_HATO,
  configuracionFincaSchema,
  leerConfiguracion,
} from "@/lib/dominio/categoria";
import { ErrorNegocio, type ResultadoAccion } from "@/lib/errores";
import { esquemaDesdeCampos } from "@/lib/formularios/campos";

export async function guardarFinca(valores: unknown): Promise<ResultadoAccion> {
  const r = await accion("configuracion:gestionar", async ({ tx }) => {
    const datos = esquemaDesdeCampos([...CAMPOS_FINCA, ...CAMPOS_HATO]).parse(valores) as Record<
      string,
      unknown
    >;
    const ideal = Object.fromEntries(CATEGORIAS_HATO.map((c) => [c, Number(datos[`ideal_${c}`])]));
    const suma = Object.values(ideal).reduce((a, b) => a + b, 0);
    if (Math.abs(suma - 100) > 0.01) {
      throw new ErrorNegocio(`Los porcentajes ideales deben sumar 100 % (suman ${suma} %).`);
    }
    const actual = await tx.finca.findUnique({ where: { id: 1 } });
    const configuracion = configuracionFincaSchema.parse({
      ...leerConfiguracion(actual?.configuracion),
      hato: {
        edadDesteteMeses: datos.edadDesteteMeses,
        edadNovillaMeses: datos.edadNovillaMeses,
        porcentajeIdeal: ideal,
      },
    });
    if (Number(datos.edadDesteteMeses) >= Number(datos.edadNovillaMeses)) {
      throw new ErrorNegocio("Revisa los datos.", {
        edadNovillaMeses: "Debe ser mayor que la edad de destete.",
      });
    }
    const general = Object.fromEntries(CAMPOS_FINCA.map((c) => [c.nombre, datos[c.nombre]]));
    await tx.finca.upsert({
      where: { id: 1 },
      create: { id: 1, ...(general as { nombre: string }), configuracion },
      update: { ...general, configuracion },
    });
  });
  if (r.ok) revalidatePath("/", "layout");
  return r;
}
