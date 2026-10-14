-- Rubros que el sistema llena solo (nómina y depreciación de activos).
ALTER TABLE "RubroCosto" ADD COLUMN "clave" TEXT;
CREATE UNIQUE INDEX "RubroCosto_clave_key" ON "RubroCosto"("clave");

-- Bases existentes: se marcan los rubros del catálogo base.
UPDATE "RubroCosto" SET "clave" = 'MANO_OBRA' WHERE "nombre" = 'Mano de obra' AND "deletedAt" IS NULL;
UPDATE "RubroCosto" SET "clave" = 'DEPRECIACIONES' WHERE "nombre" = 'Depreciaciones' AND "deletedAt" IS NULL;
