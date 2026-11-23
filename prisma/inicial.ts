/**
 * Carga inicial para PRODUCCIÓN (sin datos de prueba): la primera finca, el primer
 * administrador y los catálogos base. Las demás fincas se crean desde la aplicación. Uso:
 *
 *   FINCA_NOMBRE="La Arboleda" ADMIN_CLAVE="una-clave-segura" npm run db:inicial
 *   npm run prod:inicial      (contra Supabase, con .env.produccion; pregunta los datos)
 *
 * Lo que no venga en variables (FINCA_NOMBRE, ADMIN_CLAVE) se pregunta en la terminal.
 * Variables opcionales: ADMIN_USUARIO (por defecto "admin"), ADMIN_NOMBRE.
 * El administrador deberá cambiar la contraseña al entrar.
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { configuracionPg } from "../src/lib/conexion-bd";
import { configuracionFincaSchema } from "../src/lib/dominio/categoria";
import { conFinca, extensionFinca } from "../src/lib/finca";
import { crearCatalogosGlobales, crearCentrosFinca } from "./catalogos-base";

const prisma = new PrismaClient({
  adapter: new PrismaPg(configuracionPg()),
}).$extends(extensionFinca);

/** Valor de la variable de entorno o, si falta y hay terminal, lo pregunta. */
async function dato(variable: string, pregunta: string): Promise<string> {
  const valor = process.env[variable];
  if (valor || !process.stdin.isTTY) return valor ?? "";
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(pregunta);
  } finally {
    rl.close();
  }
}

async function main() {
  const nombreFinca = (await dato("FINCA_NOMBRE", "Nombre de la primera finca: ")).trim();
  const usuario = (process.env.ADMIN_USUARIO ?? "admin").trim().toLowerCase();
  const clave = await dato(
    "ADMIN_CLAVE",
    `Contraseña inicial del usuario «${usuario}» (mínimo 8 caracteres; se cambia al entrar): `,
  );
  if (!nombreFinca) throw new Error("Falta FINCA_NOMBRE.");
  if (clave.length < 8) throw new Error("ADMIN_CLAVE debe tener al menos 8 caracteres.");
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) throw new Error("ADMIN_USUARIO no es válido.");

  if (await prisma.finca.findFirst()) {
    console.log(
      "Ya hay fincas configuradas; no se hizo ningún cambio. Las demás fincas se crean desde la aplicación (Mis fincas).",
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    const finca = await tx.finca.create({
      data: { nombre: nombreFinca, configuracion: configuracionFincaSchema.parse({}) },
    });
    await tx.usuario.create({
      data: {
        nombre: process.env.ADMIN_NOMBRE?.trim() || "Administrador",
        usuario,
        rol: "ADMIN",
        passwordHash: await bcrypt.hash(clave, 10),
        debeCambiarClave: true,
      },
    });
    await crearCatalogosGlobales(tx as unknown as PrismaClient);
    // Los centros de costo son de la finca.
    await conFinca(finca.id, () => crearCentrosFinca(tx));
  });
  console.log(
    `Listo: finca «${nombreFinca}», usuario administrador «${usuario}» y catálogos base.`,
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
