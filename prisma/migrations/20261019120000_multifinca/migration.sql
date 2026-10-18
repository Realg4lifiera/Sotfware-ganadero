-- Multifinca: cada registro del negocio pertenece a una finca. Los datos existentes
-- pasan a la finca 1 (la única que había). El filtro por finca lo aplica la extensión de
-- Prisma de src/lib/finca.ts.

-- Ya puede haber varias fincas (antes solo existía la fila con id 1).
ALTER TABLE "Finca" DROP CONSTRAINT "Finca_registro_unico";

-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'PROPIETARIO';

-- DropIndex
DROP INDEX "Animal_numero_key";

-- DropIndex
DROP INDEX "CentroCosto_clave_key";

-- DropIndex
DROP INDEX "CentroCosto_nombre_key";

-- DropIndex
DROP INDEX "Comprador_nombre_key";

-- DropIndex
DROP INDEX "Lote_nombre_key";

-- DropIndex
DROP INDEX "Potrero_nombre_key";

-- DropIndex
DROP INDEX "Presupuesto_anio_mes_categoriaGastoId_centroCostoId_key";

-- DropIndex
DROP INDEX "ReglaProrrateo_nombre_key";

-- AlterTable
ALTER TABLE "Aborto" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Activo" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Adjunto" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
-- La auditoría existente es de la finca 1 (se asigna al crear la columna: la tabla no
-- admite UPDATE por su trigger de inmutabilidad).
ALTER TABLE "Auditoria" ADD COLUMN     "fincaId" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "Celo" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "CentroCosto" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Comprador" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ConsumoInternoLeche" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "CostoIndirecto" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "DescarteReproductivo" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "DiagnosticoPrenez" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "EntregaLeche" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "EventoSanitario" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
CREATE SEQUENCE finca_id_seq;
ALTER TABLE "Finca" ADD COLUMN     "activa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deletedAt" TIMESTAMPTZ(3),
ALTER COLUMN "id" SET DEFAULT nextval('finca_id_seq');
ALTER SEQUENCE finca_id_seq OWNED BY "Finca"."id";
-- La finca existente conserva su id (1); las nuevas siguen desde ahí.
SELECT setval('finca_id_seq', COALESCE((SELECT MAX("id") FROM "Finca"), 0) + 1, false);

-- AlterTable
ALTER TABLE "Gasto" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "HistorialReproductivo" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Ingreso" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Lactancia" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Lote" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "MovimientoAnimal" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "MovimientoPajilla" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "OcupacionPotrero" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "PagoNomina" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Pajilla" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Parto" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Pesaje" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Potrero" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Presupuesto" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "RegistroOrdeno" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ReglaProrrateo" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ReglaProrrateoDetalle" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Secado" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Servicio" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "SuministroAlimento" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Toro" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Trabajador" ADD COLUMN     "fincaId" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "UsuarioFinca" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fincaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "UsuarioFinca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioFinca_usuarioId_fincaId_key" ON "UsuarioFinca"("usuarioId", "fincaId");

-- CreateIndex
CREATE INDEX "Aborto_fincaId_idx" ON "Aborto"("fincaId");

-- CreateIndex
CREATE INDEX "Activo_fincaId_idx" ON "Activo"("fincaId");

-- CreateIndex
CREATE INDEX "Adjunto_fincaId_idx" ON "Adjunto"("fincaId");

-- CreateIndex
CREATE INDEX "Animal_fincaId_idx" ON "Animal"("fincaId");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_fincaId_numero_key" ON "Animal"("fincaId", "numero");

-- CreateIndex
CREATE INDEX "Auditoria_fincaId_idx" ON "Auditoria"("fincaId");

-- CreateIndex
CREATE INDEX "Celo_fincaId_idx" ON "Celo"("fincaId");

-- CreateIndex
CREATE INDEX "CentroCosto_fincaId_idx" ON "CentroCosto"("fincaId");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCosto_fincaId_nombre_key" ON "CentroCosto"("fincaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCosto_fincaId_clave_key" ON "CentroCosto"("fincaId", "clave");

-- CreateIndex
CREATE INDEX "Comprador_fincaId_idx" ON "Comprador"("fincaId");

-- CreateIndex
CREATE UNIQUE INDEX "Comprador_fincaId_nombre_key" ON "Comprador"("fincaId", "nombre");

-- CreateIndex
CREATE INDEX "ConsumoInternoLeche_fincaId_idx" ON "ConsumoInternoLeche"("fincaId");

-- CreateIndex
CREATE INDEX "CostoIndirecto_fincaId_idx" ON "CostoIndirecto"("fincaId");

-- CreateIndex
CREATE INDEX "DescarteReproductivo_fincaId_idx" ON "DescarteReproductivo"("fincaId");

-- CreateIndex
CREATE INDEX "DiagnosticoPrenez_fincaId_idx" ON "DiagnosticoPrenez"("fincaId");

-- CreateIndex
CREATE INDEX "EntregaLeche_fincaId_idx" ON "EntregaLeche"("fincaId");

-- CreateIndex
CREATE INDEX "EventoSanitario_fincaId_idx" ON "EventoSanitario"("fincaId");

-- CreateIndex
CREATE INDEX "Gasto_fincaId_idx" ON "Gasto"("fincaId");

-- CreateIndex
CREATE INDEX "HistorialReproductivo_fincaId_idx" ON "HistorialReproductivo"("fincaId");

-- CreateIndex
CREATE INDEX "Ingreso_fincaId_idx" ON "Ingreso"("fincaId");

-- CreateIndex
CREATE INDEX "Lactancia_fincaId_idx" ON "Lactancia"("fincaId");

-- CreateIndex
CREATE INDEX "Lote_fincaId_idx" ON "Lote"("fincaId");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_fincaId_nombre_key" ON "Lote"("fincaId", "nombre");

-- CreateIndex
CREATE INDEX "MovimientoAnimal_fincaId_idx" ON "MovimientoAnimal"("fincaId");

-- CreateIndex
CREATE INDEX "MovimientoPajilla_fincaId_idx" ON "MovimientoPajilla"("fincaId");

-- CreateIndex
CREATE INDEX "OcupacionPotrero_fincaId_idx" ON "OcupacionPotrero"("fincaId");

-- CreateIndex
CREATE INDEX "PagoNomina_fincaId_idx" ON "PagoNomina"("fincaId");

-- CreateIndex
CREATE INDEX "Pajilla_fincaId_idx" ON "Pajilla"("fincaId");

-- CreateIndex
CREATE INDEX "Parto_fincaId_idx" ON "Parto"("fincaId");

-- CreateIndex
CREATE INDEX "Pesaje_fincaId_idx" ON "Pesaje"("fincaId");

-- CreateIndex
CREATE INDEX "Potrero_fincaId_idx" ON "Potrero"("fincaId");

-- CreateIndex
CREATE UNIQUE INDEX "Potrero_fincaId_nombre_key" ON "Potrero"("fincaId", "nombre");

-- CreateIndex
CREATE INDEX "Presupuesto_fincaId_idx" ON "Presupuesto"("fincaId");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_fincaId_anio_mes_categoriaGastoId_centroCostoId_key" ON "Presupuesto"("fincaId", "anio", "mes", "categoriaGastoId", "centroCostoId");

-- CreateIndex
CREATE INDEX "RegistroOrdeno_fincaId_idx" ON "RegistroOrdeno"("fincaId");

-- CreateIndex
CREATE INDEX "ReglaProrrateo_fincaId_idx" ON "ReglaProrrateo"("fincaId");

-- CreateIndex
CREATE UNIQUE INDEX "ReglaProrrateo_fincaId_nombre_key" ON "ReglaProrrateo"("fincaId", "nombre");

-- CreateIndex
CREATE INDEX "ReglaProrrateoDetalle_fincaId_idx" ON "ReglaProrrateoDetalle"("fincaId");

-- CreateIndex
CREATE INDEX "Secado_fincaId_idx" ON "Secado"("fincaId");

-- CreateIndex
CREATE INDEX "Servicio_fincaId_idx" ON "Servicio"("fincaId");

-- CreateIndex
CREATE INDEX "SuministroAlimento_fincaId_idx" ON "SuministroAlimento"("fincaId");

-- CreateIndex
CREATE INDEX "Toro_fincaId_idx" ON "Toro"("fincaId");

-- CreateIndex
CREATE INDEX "Trabajador_fincaId_idx" ON "Trabajador"("fincaId");

-- AddForeignKey
ALTER TABLE "UsuarioFinca" ADD CONSTRAINT "UsuarioFinca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioFinca" ADD CONSTRAINT "UsuarioFinca_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Potrero" ADD CONSTRAINT "Potrero_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentroCosto" ADD CONSTRAINT "CentroCosto_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprador" ADD CONSTRAINT "Comprador_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trabajador" ADD CONSTRAINT "Trabajador_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoNomina" ADD CONSTRAINT "PagoNomina_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoIndirecto" ADD CONSTRAINT "CostoIndirecto_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaProrrateo" ADD CONSTRAINT "ReglaProrrateo_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaProrrateoDetalle" ADD CONSTRAINT "ReglaProrrateoDetalle_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Toro" ADD CONSTRAINT "Toro_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pajilla" ADD CONSTRAINT "Pajilla_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoPajilla" ADD CONSTRAINT "MovimientoPajilla_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Celo" ADD CONSTRAINT "Celo_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoPrenez" ADD CONSTRAINT "DiagnosticoPrenez_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parto" ADD CONSTRAINT "Parto_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aborto" ADD CONSTRAINT "Aborto_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secado" ADD CONSTRAINT "Secado_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescarteReproductivo" ADD CONSTRAINT "DescarteReproductivo_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialReproductivo" ADD CONSTRAINT "HistorialReproductivo_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lactancia" ADD CONSTRAINT "Lactancia_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroOrdeno" ADD CONSTRAINT "RegistroOrdeno_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaLeche" ADD CONSTRAINT "EntregaLeche_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumoInternoLeche" ADD CONSTRAINT "ConsumoInternoLeche_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesaje" ADD CONSTRAINT "Pesaje_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcupacionPotrero" ADD CONSTRAINT "OcupacionPotrero_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuministroAlimento" ADD CONSTRAINT "SuministroAlimento_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoSanitario" ADD CONSTRAINT "EventoSanitario_fincaId_fkey" FOREIGN KEY ("fincaId") REFERENCES "Finca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Los registros nuevos deben indicar su finca (lo hace la extensión): sin valor por defecto.
ALTER TABLE "Aborto" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Activo" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Adjunto" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Animal" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Celo" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "CentroCosto" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Comprador" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "ConsumoInternoLeche" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "CostoIndirecto" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "DescarteReproductivo" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "DiagnosticoPrenez" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "EntregaLeche" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "EventoSanitario" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Gasto" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "HistorialReproductivo" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Ingreso" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Lactancia" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Lote" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "MovimientoAnimal" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "MovimientoPajilla" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "OcupacionPotrero" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "PagoNomina" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Pajilla" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Parto" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Pesaje" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Potrero" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Presupuesto" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "RegistroOrdeno" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "ReglaProrrateo" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "ReglaProrrateoDetalle" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Secado" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Servicio" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "SuministroAlimento" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Toro" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Trabajador" ALTER COLUMN "fincaId" DROP DEFAULT;
ALTER TABLE "Auditoria" ALTER COLUMN "fincaId" DROP DEFAULT;

-- Los usuarios que no son administradores conservan el acceso a la finca 1.
INSERT INTO "UsuarioFinca" ("id", "usuarioId", "fincaId", "updatedAt")
SELECT 'uf_' || u."id", u."id", 1, CURRENT_TIMESTAMP
FROM "Usuario" u
WHERE u."rol" <> 'ADMIN' AND EXISTS (SELECT 1 FROM "Finca" WHERE "id" = 1);
