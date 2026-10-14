/**
 * Carga inicial para PRODUCCIÓN (sin datos de prueba): la finca, el primer administrador
 * y los catálogos base. Uso:
 *
 *   FINCA_NOMBRE="La Arboleda" ADMIN_CLAVE="una-clave-segura" npm run db:inicial
 *
 * Variables opcionales: ADMIN_USUARIO (por defecto "admin"), ADMIN_NOMBRE.
 * El administrador deberá cambiar la contraseña al entrar.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { configuracionFincaSchema } from "../src/lib/dominio/categoria";
import { crearCatalogosBase } from "./catalogos-base";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const nombreFinca = process.env.FINCA_NOMBRE?.trim();
  const usuario = (process.env.ADMIN_USUARIO ?? "admin").trim().toLowerCase();
  const clave = process.env.ADMIN_CLAVE ?? "";
  if (!nombreFinca) throw new Error("Falta FINCA_NOMBRE.");
  if (clave.length < 8) throw new Error("ADMIN_CLAVE debe tener al menos 8 caracteres.");
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) throw new Error("ADMIN_USUARIO no es válido.");

  if (await prisma.finca.findUnique({ where: { id: 1 } })) {
    console.log("La finca ya está configurada; no se hizo ningún cambio.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.finca.create({
      data: { id: 1, nombre: nombreFinca, configuracion: configuracionFincaSchema.parse({}) },
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
    await crearCatalogosBase(tx as unknown as PrismaClient);
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
