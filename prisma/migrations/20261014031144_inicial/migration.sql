-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'MAYORDOMO', 'VETERINARIO', 'CONTADOR');

-- CreateEnum
CREATE TYPE "Especie" AS ENUM ('BOVINO', 'EQUINO', 'OTRA');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('HEMBRA', 'MACHO');

-- CreateEnum
CREATE TYPE "OrigenAnimal" AS ENUM ('NACIDO', 'COMPRADO');

-- CreateEnum
CREATE TYPE "EstadoAnimal" AS ENUM ('ACTIVO', 'VENDIDO', 'MUERTO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "EstadoReproductivo" AS ENUM ('NOVILLA', 'VACIA', 'SERVIDA', 'PRENADA', 'SECA', 'PARIDA');

-- CreateEnum
CREATE TYPE "TipoMovimientoAnimal" AS ENUM ('COMPRA', 'VENTA', 'TRASLADO_LOTE', 'TRASLADO_POTRERO', 'MUERTE', 'DESCARTE');

-- CreateEnum
CREATE TYPE "PropositoLote" AS ENUM ('LECHERIA', 'CEBA', 'CRIA', 'LEVANTE', 'OTRO');

-- CreateEnum
CREATE TYPE "AccionAuditoria" AS ENUM ('CREAR', 'EDITAR', 'ELIMINAR');

-- CreateEnum
CREATE TYPE "GrupoCosto" AS ENUM ('COSTO_FIJO', 'COSTO_VARIABLE', 'GASTO_EMPRESARIAL');

-- CreateEnum
CREATE TYPE "TipoCategoriaGasto" AS ENUM ('INSUMO', 'MANO_OBRA', 'INDIRECTO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoInsumo" AS ENUM ('ALIMENTO', 'SAL', 'SUPLEMENTO', 'MEDICAMENTO', 'SEMEN', 'FERTILIZANTE', 'COMBUSTIBLE', 'OTRO');

-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('KG', 'G', 'L', 'ML', 'BULTO', 'UNIDAD', 'DOSIS', 'GALON');

-- CreateEnum
CREATE TYPE "OrigenCompra" AS ENUM ('COOPERATIVA', 'EXTERNA');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('CON_PRESTACIONES', 'SIN_PRESTACIONES');

-- CreateEnum
CREATE TYPE "Periodicidad" AS ENUM ('MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "TipoIngreso" AS ENUM ('VENTA_LECHE', 'VENTA_ANIMAL', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoMovimientoPajilla" AS ENUM ('ENTRADA', 'USO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('MONTA_NATURAL', 'INSEMINACION');

-- CreateEnum
CREATE TYPE "MetodoDiagnostico" AS ENUM ('PALPACION', 'ECOGRAFIA');

-- CreateEnum
CREATE TYPE "ResultadoDiagnostico" AS ENUM ('PRENADA', 'VACIA');

-- CreateEnum
CREATE TYPE "TipoParto" AS ENUM ('NORMAL', 'ASISTIDO');

-- CreateEnum
CREATE TYPE "Jornada" AS ENUM ('MANANA', 'TARDE', 'DIA');

-- CreateEnum
CREATE TYPE "DestinoConsumoLeche" AS ENUM ('TRABAJADORES', 'TERNERAS', 'RETIRO', 'ARRIENDO');

-- CreateEnum
CREATE TYPE "MetodoPesaje" AS ENUM ('BASCULA', 'CINTA');

-- CreateEnum
CREATE TYPE "TipoEventoSanitario" AS ENUM ('VACUNA', 'DESPARASITACION', 'TRATAMIENTO');

-- CreateTable
CREATE TABLE "Finca" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "propietario" TEXT,
    "nit" TEXT,
    "telefono" TEXT,
    "departamento" TEXT,
    "municipio" TEXT,
    "vereda" TEXT,
    "areaTotalHa" DECIMAL(10,2),
    "areaUtilHa" DECIMAL(10,2),
    "tipoOrdeno" TEXT,
    "configuracion" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Finca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "debeCambiarClave" BOOLEAN NOT NULL DEFAULT false,
    "ultimoAcceso" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Potrero" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "areaHa" DECIMAL(10,2),
    "tipoPasto" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Potrero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "proposito" "PropositoLote" NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raza" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Raza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "nombre" TEXT,
    "especie" "Especie" NOT NULL DEFAULT 'BOVINO',
    "razaId" TEXT,
    "sexo" "Sexo" NOT NULL,
    "fechaNacimiento" DATE,
    "fechaNacimientoEstimada" BOOLEAN NOT NULL DEFAULT false,
    "origen" "OrigenAnimal" NOT NULL,
    "fechaIngreso" DATE NOT NULL,
    "pesoNacimientoKg" DECIMAL(8,2),
    "madreId" TEXT,
    "padreId" TEXT,
    "partoId" TEXT,
    "loteId" TEXT,
    "potreroId" TEXT,
    "fotoClave" TEXT,
    "estado" "EstadoAnimal" NOT NULL DEFAULT 'ACTIVO',
    "estadoReproductivo" "EstadoReproductivo",
    "numeroPartos" INTEGER NOT NULL DEFAULT 0,
    "fechaSalida" DATE,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoAnimal" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoMovimientoAnimal" NOT NULL,
    "fecha" DATE NOT NULL,
    "motivo" TEXT,
    "loteOrigenId" TEXT,
    "loteDestinoId" TEXT,
    "potreroOrigenId" TEXT,
    "potreroDestinoId" TEXT,
    "valor" DECIMAL(16,2),
    "pesoKg" DECIMAL(8,2),
    "compradorId" TEXT,
    "proveedorId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MovimientoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjunto" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Adjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "usuarioNombre" TEXT,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" "AccionAuditoria" NOT NULL,
    "antes" JSONB,
    "despues" JSONB,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentroCosto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CentroCosto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubroCosto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupo" "GrupoCosto" NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "RubroCosto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaGasto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCategoriaGasto" NOT NULL,
    "rubroId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CategoriaGasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comprador" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Comprador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoInsumo" NOT NULL,
    "unidad" "UnidadMedida" NOT NULL,
    "presentacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "centroCostoId" TEXT NOT NULL,
    "proveedorId" TEXT,
    "insumoId" TEXT,
    "descripcion" TEXT NOT NULL,
    "presentacion" TEXT,
    "marca" TEXT,
    "contenido" DECIMAL(12,3),
    "cantidad" DECIMAL(12,3),
    "valorUnitario" DECIMAL(16,2),
    "descuento" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "ivaPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "valorIva" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(16,2) NOT NULL,
    "numeroFactura" TEXT,
    "origen" "OrigenCompra" NOT NULL DEFAULT 'EXTERNA',
    "notas" TEXT,
    "animalId" TEXT,
    "loteId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trabajador" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT,
    "telefono" TEXT,
    "cargo" TEXT,
    "tipoContrato" "TipoContrato" NOT NULL,
    "salarioBase" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "eventual" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaIngreso" DATE,
    "fechaRetiro" DATE,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Trabajador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoNomina" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "periodoInicio" DATE,
    "periodoFin" DATE,
    "labor" TEXT,
    "jornales" DECIMAL(8,2),
    "salario" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "auxilioTransporte" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "salud" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "pension" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "arl" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "nivelRiesgoArl" INTEGER,
    "prima" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "vacaciones" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "cesantias" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "interesesCesantias" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "bonificacion" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "costoTotal" DECIMAL(16,2) NOT NULL,
    "centroCostoId" TEXT NOT NULL,
    "loteId" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PagoNomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostoIndirecto" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "periodicidad" "Periodicidad" NOT NULL DEFAULT 'MENSUAL',
    "valorTotal" DECIMAL(16,2) NOT NULL,
    "litros" DECIMAL(10,2),
    "centroCostoId" TEXT,
    "reglaProrrateoId" TEXT,
    "activoId" TEXT,
    "proveedorId" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CostoIndirecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglaProrrateo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ReglaProrrateo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglaProrrateoDetalle" (
    "id" TEXT NOT NULL,
    "reglaProrrateoId" TEXT NOT NULL,
    "centroCostoId" TEXT NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ReglaProrrateoDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "valorCompra" DECIMAL(16,2) NOT NULL,
    "fechaCompra" DATE NOT NULL,
    "vidaUtilMeses" INTEGER NOT NULL,
    "valorResidual" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "centroCostoId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Activo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingreso" (
    "id" TEXT NOT NULL,
    "tipo" "TipoIngreso" NOT NULL,
    "concepto" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "compradorId" TEXT,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "precioUnitario" DECIMAL(16,2) NOT NULL,
    "total" DECIMAL(16,2) NOT NULL,
    "animalId" TEXT,
    "movimientoAnimalId" TEXT,
    "centroCostoId" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "categoriaGastoId" TEXT NOT NULL,
    "centroCostoId" TEXT,
    "valor" DECIMAL(16,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Toro" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "razaId" TEXT,
    "propio" BOOLEAN NOT NULL DEFAULT false,
    "animalId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Toro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pajilla" (
    "id" TEXT NOT NULL,
    "toroId" TEXT NOT NULL,
    "razaId" TEXT,
    "proveedorId" TEXT,
    "codigo" TEXT,
    "ubicacionTermo" TEXT,
    "existencias" INTEGER NOT NULL DEFAULT 0,
    "valorUnitario" DECIMAL(16,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Pajilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoPajilla" (
    "id" TEXT NOT NULL,
    "pajillaId" TEXT NOT NULL,
    "tipo" "TipoMovimientoPajilla" NOT NULL,
    "fecha" DATE NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "servicioId" TEXT,
    "gastoId" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MovimientoPajilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Celo" (
    "id" TEXT NOT NULL,
    "hembraId" TEXT NOT NULL,
    "fechaHora" TIMESTAMPTZ(3) NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Celo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL,
    "hembraId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoServicio" NOT NULL,
    "toroId" TEXT,
    "pajillaId" TEXT,
    "inseminador" TEXT,
    "numeroServicio" INTEGER NOT NULL DEFAULT 1,
    "celoId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticoPrenez" (
    "id" TEXT NOT NULL,
    "hembraId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "metodo" "MetodoDiagnostico" NOT NULL,
    "resultado" "ResultadoDiagnostico" NOT NULL,
    "diasGestacion" INTEGER,
    "fechaProbableParto" DATE,
    "servicioId" TEXT,
    "veterinario" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "DiagnosticoPrenez_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parto" (
    "id" TEXT NOT NULL,
    "hembraId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoParto" NOT NULL,
    "servicioId" TEXT,
    "toroId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Parto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aborto" (
    "id" TEXT NOT NULL,
    "hembraId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "causa" TEXT,
    "diasGestacion" INTEGER,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Aborto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secado" (
    "id" TEXT NOT NULL,
    "hembraId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "lactanciaId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Secado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DescarteReproductivo" (
    "id" TEXT NOT NULL,
    "hembraId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "motivo" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "DescarteReproductivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lactancia" (
    "id" TEXT NOT NULL,
    "vacaId" TEXT NOT NULL,
    "partoId" TEXT,
    "numero" INTEGER NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Lactancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroOrdeno" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "jornada" "Jornada" NOT NULL,
    "litros" DECIMAL(10,2) NOT NULL,
    "animalId" TEXT,
    "loteId" TEXT,
    "lactanciaId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "RegistroOrdeno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaLeche" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "compradorId" TEXT NOT NULL,
    "litros" DECIMAL(10,2) NOT NULL,
    "precioLitro" DECIMAL(16,2),
    "nota" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "EntregaLeche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumoInternoLeche" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "destino" "DestinoConsumoLeche" NOT NULL,
    "litros" DECIMAL(10,2) NOT NULL,
    "valor" DECIMAL(16,2),
    "nota" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ConsumoInternoLeche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pesaje" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "pesoKg" DECIMAL(8,2) NOT NULL,
    "metodo" "MetodoPesaje" NOT NULL,
    "loteId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Pesaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcupacionPotrero" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "potreroId" TEXT NOT NULL,
    "fechaEntrada" DATE NOT NULL,
    "fechaSalida" DATE,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "OcupacionPotrero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuministroAlimento" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "loteId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "gastoId" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SuministroAlimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoSanitario" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEventoSanitario" NOT NULL,
    "fecha" DATE NOT NULL,
    "insumoId" TEXT,
    "producto" TEXT NOT NULL,
    "dosis" TEXT,
    "via" TEXT,
    "diagnostico" TEXT,
    "animalId" TEXT,
    "loteId" TEXT,
    "veterinario" TEXT,
    "retiroLecheHasta" DATE,
    "retiroCarneHasta" DATE,
    "gastoId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "EventoSanitario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_usuario_key" ON "Usuario"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Potrero_nombre_key" ON "Potrero"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_nombre_key" ON "Lote"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Raza_nombre_key" ON "Raza"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_numero_key" ON "Animal"("numero");

-- CreateIndex
CREATE INDEX "Animal_loteId_idx" ON "Animal"("loteId");

-- CreateIndex
CREATE INDEX "Animal_potreroId_idx" ON "Animal"("potreroId");

-- CreateIndex
CREATE INDEX "Animal_estado_idx" ON "Animal"("estado");

-- CreateIndex
CREATE INDEX "Animal_madreId_idx" ON "Animal"("madreId");

-- CreateIndex
CREATE INDEX "Animal_padreId_idx" ON "Animal"("padreId");

-- CreateIndex
CREATE INDEX "Animal_nombre_idx" ON "Animal"("nombre");

-- CreateIndex
CREATE INDEX "MovimientoAnimal_animalId_fecha_idx" ON "MovimientoAnimal"("animalId", "fecha");

-- CreateIndex
CREATE INDEX "MovimientoAnimal_fecha_idx" ON "MovimientoAnimal"("fecha");

-- CreateIndex
CREATE INDEX "MovimientoAnimal_tipo_fecha_idx" ON "MovimientoAnimal"("tipo", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Adjunto_clave_key" ON "Adjunto"("clave");

-- CreateIndex
CREATE INDEX "Adjunto_entidad_entidadId_idx" ON "Adjunto"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "Auditoria_entidad_entidadId_idx" ON "Auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "Auditoria_fecha_idx" ON "Auditoria"("fecha");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_fecha_idx" ON "Auditoria"("usuarioId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCosto_nombre_key" ON "CentroCosto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "RubroCosto_nombre_key" ON "RubroCosto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaGasto_nombre_key" ON "CategoriaGasto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Comprador_nombre_key" ON "Comprador"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Insumo_nombre_key" ON "Insumo"("nombre");

-- CreateIndex
CREATE INDEX "Gasto_fecha_idx" ON "Gasto"("fecha");

-- CreateIndex
CREATE INDEX "Gasto_centroCostoId_fecha_idx" ON "Gasto"("centroCostoId", "fecha");

-- CreateIndex
CREATE INDEX "Gasto_categoriaId_fecha_idx" ON "Gasto"("categoriaId", "fecha");

-- CreateIndex
CREATE INDEX "Gasto_animalId_fecha_idx" ON "Gasto"("animalId", "fecha");

-- CreateIndex
CREATE INDEX "Gasto_loteId_fecha_idx" ON "Gasto"("loteId", "fecha");

-- CreateIndex
CREATE INDEX "PagoNomina_fecha_idx" ON "PagoNomina"("fecha");

-- CreateIndex
CREATE INDEX "PagoNomina_trabajadorId_fecha_idx" ON "PagoNomina"("trabajadorId", "fecha");

-- CreateIndex
CREATE INDEX "PagoNomina_centroCostoId_fecha_idx" ON "PagoNomina"("centroCostoId", "fecha");

-- CreateIndex
CREATE INDEX "CostoIndirecto_fecha_idx" ON "CostoIndirecto"("fecha");

-- CreateIndex
CREATE INDEX "CostoIndirecto_categoriaId_fecha_idx" ON "CostoIndirecto"("categoriaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ReglaProrrateo_nombre_key" ON "ReglaProrrateo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ReglaProrrateoDetalle_reglaProrrateoId_centroCostoId_key" ON "ReglaProrrateoDetalle"("reglaProrrateoId", "centroCostoId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingreso_movimientoAnimalId_key" ON "Ingreso"("movimientoAnimalId");

-- CreateIndex
CREATE INDEX "Ingreso_fecha_idx" ON "Ingreso"("fecha");

-- CreateIndex
CREATE INDEX "Ingreso_tipo_fecha_idx" ON "Ingreso"("tipo", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_anio_mes_categoriaGastoId_centroCostoId_key" ON "Presupuesto"("anio", "mes", "categoriaGastoId", "centroCostoId");

-- CreateIndex
CREATE UNIQUE INDEX "Toro_animalId_key" ON "Toro"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoPajilla_servicioId_key" ON "MovimientoPajilla"("servicioId");

-- CreateIndex
CREATE INDEX "MovimientoPajilla_pajillaId_fecha_idx" ON "MovimientoPajilla"("pajillaId", "fecha");

-- CreateIndex
CREATE INDEX "Celo_hembraId_fechaHora_idx" ON "Celo"("hembraId", "fechaHora");

-- CreateIndex
CREATE INDEX "Celo_fechaHora_idx" ON "Celo"("fechaHora");

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_celoId_key" ON "Servicio"("celoId");

-- CreateIndex
CREATE INDEX "Servicio_hembraId_fecha_idx" ON "Servicio"("hembraId", "fecha");

-- CreateIndex
CREATE INDEX "Servicio_fecha_idx" ON "Servicio"("fecha");

-- CreateIndex
CREATE INDEX "DiagnosticoPrenez_hembraId_fecha_idx" ON "DiagnosticoPrenez"("hembraId", "fecha");

-- CreateIndex
CREATE INDEX "DiagnosticoPrenez_fecha_idx" ON "DiagnosticoPrenez"("fecha");

-- CreateIndex
CREATE INDEX "Parto_hembraId_fecha_idx" ON "Parto"("hembraId", "fecha");

-- CreateIndex
CREATE INDEX "Parto_fecha_idx" ON "Parto"("fecha");

-- CreateIndex
CREATE INDEX "Aborto_hembraId_fecha_idx" ON "Aborto"("hembraId", "fecha");

-- CreateIndex
CREATE INDEX "Aborto_fecha_idx" ON "Aborto"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Secado_lactanciaId_key" ON "Secado"("lactanciaId");

-- CreateIndex
CREATE INDEX "Secado_hembraId_fecha_idx" ON "Secado"("hembraId", "fecha");

-- CreateIndex
CREATE INDEX "Secado_fecha_idx" ON "Secado"("fecha");

-- CreateIndex
CREATE INDEX "DescarteReproductivo_hembraId_fecha_idx" ON "DescarteReproductivo"("hembraId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Lactancia_partoId_key" ON "Lactancia"("partoId");

-- CreateIndex
CREATE INDEX "Lactancia_vacaId_fechaInicio_idx" ON "Lactancia"("vacaId", "fechaInicio");

-- CreateIndex
CREATE INDEX "Lactancia_fechaFin_idx" ON "Lactancia"("fechaFin");

-- CreateIndex
CREATE INDEX "RegistroOrdeno_loteId_fecha_idx" ON "RegistroOrdeno"("loteId", "fecha");

-- CreateIndex
CREATE INDEX "RegistroOrdeno_fecha_idx" ON "RegistroOrdeno"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroOrdeno_animalId_fecha_jornada_key" ON "RegistroOrdeno"("animalId", "fecha", "jornada");

-- CreateIndex
CREATE INDEX "EntregaLeche_fecha_idx" ON "EntregaLeche"("fecha");

-- CreateIndex
CREATE INDEX "ConsumoInternoLeche_fecha_idx" ON "ConsumoInternoLeche"("fecha");

-- CreateIndex
CREATE INDEX "ConsumoInternoLeche_destino_fecha_idx" ON "ConsumoInternoLeche"("destino", "fecha");

-- CreateIndex
CREATE INDEX "Pesaje_animalId_fecha_idx" ON "Pesaje"("animalId", "fecha");

-- CreateIndex
CREATE INDEX "Pesaje_loteId_fecha_idx" ON "Pesaje"("loteId", "fecha");

-- CreateIndex
CREATE INDEX "Pesaje_fecha_idx" ON "Pesaje"("fecha");

-- CreateIndex
CREATE INDEX "OcupacionPotrero_potreroId_fechaEntrada_idx" ON "OcupacionPotrero"("potreroId", "fechaEntrada");

-- CreateIndex
CREATE INDEX "OcupacionPotrero_loteId_fechaEntrada_idx" ON "OcupacionPotrero"("loteId", "fechaEntrada");

-- CreateIndex
CREATE INDEX "SuministroAlimento_loteId_fecha_idx" ON "SuministroAlimento"("loteId", "fecha");

-- CreateIndex
CREATE INDEX "SuministroAlimento_fecha_idx" ON "SuministroAlimento"("fecha");

-- CreateIndex
CREATE INDEX "EventoSanitario_animalId_fecha_idx" ON "EventoSanitario"("animalId", "fecha");

-- CreateIndex
CREATE INDEX "EventoSanitario_loteId_fecha_idx" ON "EventoSanitario"("loteId", "fecha");

-- CreateIndex
CREATE INDEX "EventoSanitario_fecha_idx" ON "EventoSanitario"("fecha");

-- CreateIndex
CREATE INDEX "EventoSanitario_retiroLecheHasta_idx" ON "EventoSanitario"("retiroLecheHasta");

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_razaId_fkey" FOREIGN KEY ("razaId") REFERENCES "Raza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_madreId_fkey" FOREIGN KEY ("madreId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_padreId_fkey" FOREIGN KEY ("padreId") REFERENCES "Toro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_partoId_fkey" FOREIGN KEY ("partoId") REFERENCES "Parto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_potreroId_fkey" FOREIGN KEY ("potreroId") REFERENCES "Potrero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_loteOrigenId_fkey" FOREIGN KEY ("loteOrigenId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_loteDestinoId_fkey" FOREIGN KEY ("loteDestinoId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_potreroOrigenId_fkey" FOREIGN KEY ("potreroOrigenId") REFERENCES "Potrero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_potreroDestinoId_fkey" FOREIGN KEY ("potreroDestinoId") REFERENCES "Potrero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "Comprador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaGasto" ADD CONSTRAINT "CategoriaGasto_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "RubroCosto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaGasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoNomina" ADD CONSTRAINT "PagoNomina_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoNomina" ADD CONSTRAINT "PagoNomina_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoNomina" ADD CONSTRAINT "PagoNomina_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoIndirecto" ADD CONSTRAINT "CostoIndirecto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaGasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoIndirecto" ADD CONSTRAINT "CostoIndirecto_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoIndirecto" ADD CONSTRAINT "CostoIndirecto_reglaProrrateoId_fkey" FOREIGN KEY ("reglaProrrateoId") REFERENCES "ReglaProrrateo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoIndirecto" ADD CONSTRAINT "CostoIndirecto_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoIndirecto" ADD CONSTRAINT "CostoIndirecto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaProrrateoDetalle" ADD CONSTRAINT "ReglaProrrateoDetalle_reglaProrrateoId_fkey" FOREIGN KEY ("reglaProrrateoId") REFERENCES "ReglaProrrateo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglaProrrateoDetalle" ADD CONSTRAINT "ReglaProrrateoDetalle_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "Comprador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_movimientoAnimalId_fkey" FOREIGN KEY ("movimientoAnimalId") REFERENCES "MovimientoAnimal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_categoriaGastoId_fkey" FOREIGN KEY ("categoriaGastoId") REFERENCES "CategoriaGasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Toro" ADD CONSTRAINT "Toro_razaId_fkey" FOREIGN KEY ("razaId") REFERENCES "Raza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Toro" ADD CONSTRAINT "Toro_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pajilla" ADD CONSTRAINT "Pajilla_toroId_fkey" FOREIGN KEY ("toroId") REFERENCES "Toro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pajilla" ADD CONSTRAINT "Pajilla_razaId_fkey" FOREIGN KEY ("razaId") REFERENCES "Raza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pajilla" ADD CONSTRAINT "Pajilla_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoPajilla" ADD CONSTRAINT "MovimientoPajilla_pajillaId_fkey" FOREIGN KEY ("pajillaId") REFERENCES "Pajilla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoPajilla" ADD CONSTRAINT "MovimientoPajilla_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoPajilla" ADD CONSTRAINT "MovimientoPajilla_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Celo" ADD CONSTRAINT "Celo_hembraId_fkey" FOREIGN KEY ("hembraId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_hembraId_fkey" FOREIGN KEY ("hembraId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_toroId_fkey" FOREIGN KEY ("toroId") REFERENCES "Toro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_pajillaId_fkey" FOREIGN KEY ("pajillaId") REFERENCES "Pajilla"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_celoId_fkey" FOREIGN KEY ("celoId") REFERENCES "Celo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoPrenez" ADD CONSTRAINT "DiagnosticoPrenez_hembraId_fkey" FOREIGN KEY ("hembraId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoPrenez" ADD CONSTRAINT "DiagnosticoPrenez_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parto" ADD CONSTRAINT "Parto_hembraId_fkey" FOREIGN KEY ("hembraId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parto" ADD CONSTRAINT "Parto_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parto" ADD CONSTRAINT "Parto_toroId_fkey" FOREIGN KEY ("toroId") REFERENCES "Toro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aborto" ADD CONSTRAINT "Aborto_hembraId_fkey" FOREIGN KEY ("hembraId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secado" ADD CONSTRAINT "Secado_hembraId_fkey" FOREIGN KEY ("hembraId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secado" ADD CONSTRAINT "Secado_lactanciaId_fkey" FOREIGN KEY ("lactanciaId") REFERENCES "Lactancia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescarteReproductivo" ADD CONSTRAINT "DescarteReproductivo_hembraId_fkey" FOREIGN KEY ("hembraId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lactancia" ADD CONSTRAINT "Lactancia_vacaId_fkey" FOREIGN KEY ("vacaId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lactancia" ADD CONSTRAINT "Lactancia_partoId_fkey" FOREIGN KEY ("partoId") REFERENCES "Parto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroOrdeno" ADD CONSTRAINT "RegistroOrdeno_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroOrdeno" ADD CONSTRAINT "RegistroOrdeno_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroOrdeno" ADD CONSTRAINT "RegistroOrdeno_lactanciaId_fkey" FOREIGN KEY ("lactanciaId") REFERENCES "Lactancia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaLeche" ADD CONSTRAINT "EntregaLeche_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "Comprador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesaje" ADD CONSTRAINT "Pesaje_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesaje" ADD CONSTRAINT "Pesaje_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcupacionPotrero" ADD CONSTRAINT "OcupacionPotrero_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcupacionPotrero" ADD CONSTRAINT "OcupacionPotrero_potreroId_fkey" FOREIGN KEY ("potreroId") REFERENCES "Potrero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuministroAlimento" ADD CONSTRAINT "SuministroAlimento_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuministroAlimento" ADD CONSTRAINT "SuministroAlimento_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuministroAlimento" ADD CONSTRAINT "SuministroAlimento_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoSanitario" ADD CONSTRAINT "EventoSanitario_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoSanitario" ADD CONSTRAINT "EventoSanitario_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoSanitario" ADD CONSTRAINT "EventoSanitario_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoSanitario" ADD CONSTRAINT "EventoSanitario_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Restricciones de integridad que Prisma no modela (escritas a mano).
-- ─────────────────────────────────────────────────────────────────────────────

-- Finca: registro único.
ALTER TABLE "Finca" ADD CONSTRAINT "Finca_registro_unico" CHECK ("id" = 1);

-- Estado reproductivo solo para hembras.
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_estado_reproductivo_solo_hembras"
  CHECK ("estadoReproductivo" IS NULL OR "sexo" = 'HEMBRA');
-- Un animal no puede ser su propia madre.
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_madre_distinta" CHECK ("madreId" IS NULL OR "madreId" <> "id");
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_numero_partos_no_negativo" CHECK ("numeroPartos" >= 0);

-- Eventos que apuntan a un animal O a un lote (exactamente uno).
ALTER TABLE "RegistroOrdeno" ADD CONSTRAINT "RegistroOrdeno_animal_xor_lote"
  CHECK (num_nonnulls("animalId", "loteId") = 1);
ALTER TABLE "EventoSanitario" ADD CONSTRAINT "EventoSanitario_animal_xor_lote"
  CHECK (num_nonnulls("animalId", "loteId") = 1);
-- Gasto: asignación directa opcional, a lo sumo a uno.
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_animal_o_lote" CHECK (num_nonnulls("animalId", "loteId") <= 1);

-- Servicio: toro en monta natural, pajilla en inseminación.
ALTER TABLE "Servicio" ADD CONSTRAINT "Servicio_toro_o_pajilla_segun_tipo" CHECK (
  ("tipo" = 'MONTA_NATURAL' AND "toroId" IS NOT NULL) OR
  ("tipo" = 'INSEMINACION' AND "pajillaId" IS NOT NULL)
);

-- Valores positivos.
ALTER TABLE "RegistroOrdeno" ADD CONSTRAINT "RegistroOrdeno_litros_positivos" CHECK ("litros" >= 0);
ALTER TABLE "EntregaLeche" ADD CONSTRAINT "EntregaLeche_litros_positivos" CHECK ("litros" >= 0);
ALTER TABLE "ConsumoInternoLeche" ADD CONSTRAINT "ConsumoInternoLeche_litros_positivos" CHECK ("litros" >= 0);
ALTER TABLE "Pesaje" ADD CONSTRAINT "Pesaje_peso_positivo" CHECK ("pesoKg" > 0);
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_valor_no_negativo" CHECK ("valorTotal" >= 0);
ALTER TABLE "Pajilla" ADD CONSTRAINT "Pajilla_existencias_no_negativas" CHECK ("existencias" >= 0);
ALTER TABLE "ReglaProrrateoDetalle" ADD CONSTRAINT "ReglaProrrateoDetalle_porcentaje_rango"
  CHECK ("porcentaje" > 0 AND "porcentaje" <= 100);
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_mes_valido" CHECK ("mes" BETWEEN 1 AND 12);

-- Fechas coherentes.
ALTER TABLE "Lactancia" ADD CONSTRAINT "Lactancia_fechas" CHECK ("fechaFin" IS NULL OR "fechaFin" >= "fechaInicio");
ALTER TABLE "OcupacionPotrero" ADD CONSTRAINT "OcupacionPotrero_fechas"
  CHECK ("fechaSalida" IS NULL OR "fechaSalida" >= "fechaEntrada");

-- Una sola lactancia abierta por vaca.
CREATE UNIQUE INDEX "Lactancia_una_abierta_por_vaca" ON "Lactancia" ("vacaId")
  WHERE "fechaFin" IS NULL AND "deletedAt" IS NULL;

-- Ordeño por lote: un registro por lote, fecha y jornada.
CREATE UNIQUE INDEX "RegistroOrdeno_lote_fecha_jornada" ON "RegistroOrdeno" ("loteId", "fecha", "jornada")
  WHERE "loteId" IS NOT NULL AND "deletedAt" IS NULL;

-- La auditoría es de solo inserción.
CREATE FUNCTION auditoria_inmutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La auditoría no se puede modificar ni borrar';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "Auditoria_solo_insercion" BEFORE UPDATE OR DELETE ON "Auditoria"
  FOR EACH ROW EXECUTE FUNCTION auditoria_inmutable();
