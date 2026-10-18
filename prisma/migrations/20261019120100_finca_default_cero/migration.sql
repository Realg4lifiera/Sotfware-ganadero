-- fincaId con valor por defecto 0 (no existe ninguna finca 0): la extensión de
-- lib/finca.ts siempre pone la finca; si algo la omitiera, la FK rechaza el registro.

-- AlterTable
ALTER TABLE "Aborto" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Activo" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Adjunto" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Animal" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Celo" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "CentroCosto" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Comprador" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ConsumoInternoLeche" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "CostoIndirecto" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "DescarteReproductivo" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "DiagnosticoPrenez" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "EntregaLeche" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "EventoSanitario" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Gasto" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "HistorialReproductivo" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Ingreso" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Lactancia" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Lote" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "MovimientoAnimal" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "MovimientoPajilla" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "OcupacionPotrero" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PagoNomina" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Pajilla" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Parto" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Pesaje" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Potrero" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Presupuesto" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "RegistroOrdeno" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ReglaProrrateo" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ReglaProrrateoDetalle" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Secado" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Servicio" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SuministroAlimento" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Toro" ALTER COLUMN "fincaId" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Trabajador" ALTER COLUMN "fincaId" SET DEFAULT 0;

