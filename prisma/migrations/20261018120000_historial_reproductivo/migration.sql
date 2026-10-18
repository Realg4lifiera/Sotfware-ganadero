-- CreateEnum
CREATE TYPE "TipoEventoReproductivo" AS ENUM ('CELO', 'SERVICIO', 'DIAGNOSTICO', 'PARTO', 'ABORTO', 'SECADO', 'DESCARTE');

-- CreateTable
CREATE TABLE "HistorialReproductivo" (
    "id" TEXT NOT NULL,
    "hembraId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoEventoReproductivo" NOT NULL,
    "eventoId" TEXT NOT NULL,
    "estadoAntes" "EstadoReproductivo" NOT NULL,
    "estadoDespues" "EstadoReproductivo" NOT NULL,
    "numeroPartosAntes" INTEGER NOT NULL,
    "lactanciaAbiertaId" TEXT,
    "lactanciaCerradaId" TEXT,
    "estadoAnimalAntes" "EstadoAnimal",
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "HistorialReproductivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HistorialReproductivo_eventoId_key" ON "HistorialReproductivo"("eventoId");

-- CreateIndex
CREATE INDEX "HistorialReproductivo_hembraId_fecha_idx" ON "HistorialReproductivo"("hembraId", "fecha");

-- AddForeignKey
ALTER TABLE "HistorialReproductivo" ADD CONSTRAINT "HistorialReproductivo_hembraId_fkey" FOREIGN KEY ("hembraId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

