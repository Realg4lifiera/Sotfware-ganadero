-- Centro de costo reconocido por el sistema (costo por litro de lechería).
ALTER TABLE "CentroCosto" ADD COLUMN "clave" TEXT;
CREATE UNIQUE INDEX "CentroCosto_clave_key" ON "CentroCosto"("clave");
UPDATE "CentroCosto" SET "clave" = 'LECHERIA' WHERE "nombre" = 'Lechería' AND "deletedAt" IS NULL;
