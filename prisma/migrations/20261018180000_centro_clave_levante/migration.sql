-- Centros reconocidos para el costo por kilo ganado (cría y levante, ceba).
UPDATE "CentroCosto" SET "clave" = 'CRIA_LEVANTE' WHERE "nombre" = 'Cría y levante' AND "deletedAt" IS NULL AND "clave" IS NULL;
UPDATE "CentroCosto" SET "clave" = 'CEBA' WHERE "nombre" = 'Ceba' AND "deletedAt" IS NULL AND "clave" IS NULL;
