/**
 * Catálogos base colombianos (razas, centros de costo, rubros y categorías de gasto
 * estilo Colanta, insumos). Los usan el seed de prueba y la carga inicial de producción.
 */
import type { PrismaClient } from "../src/generated/prisma/client";

export const RAZAS = [
  "Holstein",
  "Jersey",
  "Normando",
  "Gyr",
  "Brahman",
  "Ayrshire",
  "Pardo Suizo",
  "Blanco Orejinegro (BON)",
  "Romosinuano",
  "Cebú comercial",
  "Gyrolando (Holstein × Gyr)",
  "Jersolando (Jersey × Holstein)",
  "Normando × Holstein",
  "Cruce",
  "Criollo (equino)",
];

export const CENTROS_COSTO = [
  ["Lechería", "Vacas en producción y secas"],
  ["Cría y levante", "Terneras, novillas y machos de levante"],
  ["Ceba", "Machos de ceba"],
  ["Pasturas", "Fertilización, renovación y mantenimiento de potreros"],
  ["Administración", "Gastos generales de la finca"],
] as const;

/** Rubros del informe de costos (Excel "Costo de litro" de Colanta). */
export const RUBROS = [
  ["Mantenimiento de equipos", "COSTO_FIJO"],
  ["Mano de obra", "COSTO_FIJO"],
  ["Servicios públicos e impuestos", "COSTO_FIJO"],
  ["Arriendos", "COSTO_FIJO"],
  ["Depreciaciones", "COSTO_FIJO"],
  ["Retención en la fuente", "COSTO_FIJO"],
  ["Alimentación", "COSTO_VARIABLE"],
  ["Pasturas", "COSTO_VARIABLE"],
  ["Sanidad animal", "COSTO_VARIABLE"],
  ["Reproducción", "COSTO_VARIABLE"],
  ["Insumos de operación", "COSTO_VARIABLE"],
  ["Combustibles y lubricantes", "COSTO_VARIABLE"],
  ["Transporte de leche e insumos", "COSTO_VARIABLE"],
  ["Gastos financieros", "GASTO_EMPRESARIAL"],
  ["Servicios técnicos", "GASTO_EMPRESARIAL"],
  ["Otros gastos", "GASTO_EMPRESARIAL"],
] as const;

/** Categorías de gasto → rubro (compras, nómina y gastos administrativos de Colanta). */
export const CATEGORIAS_GASTO = [
  ["Concentrado y alimento balanceado", "INSUMO", "Alimentación"],
  ["Sales mineralizadas", "INSUMO", "Alimentación"],
  ["Forrajes, henos y ensilajes", "INSUMO", "Alimentación"],
  ["Fertilizantes", "INSUMO", "Pasturas"],
  ["Herbicidas y plaguicidas", "INSUMO", "Pasturas"],
  ["Semillas y renovación de praderas", "INSUMO", "Pasturas"],
  ["Medicamentos y vacunas", "INSUMO", "Sanidad animal"],
  ["Semen y material de inseminación", "INSUMO", "Reproducción"],
  ["Hormonas y protocolos reproductivos", "INSUMO", "Reproducción"],
  ["Insumos de ordeño y aseo", "INSUMO", "Insumos de operación"],
  ["Combustibles y lubricantes", "INSUMO", "Combustibles y lubricantes"],
  ["Mantenimiento equipo agroindustrial", "INDIRECTO", "Mantenimiento de equipos"],
  ["Nómina", "MANO_OBRA", "Mano de obra"],
  ["Jornales", "MANO_OBRA", "Mano de obra"],
  ["Impuesto predial", "INDIRECTO", "Servicios públicos e impuestos"],
  ["Servicios públicos", "INDIRECTO", "Servicios públicos e impuestos"],
  ["Arriendo", "INDIRECTO", "Arriendos"],
  ["Depreciación de activos", "INDIRECTO", "Depreciaciones"],
  ["Retención en la fuente", "INDIRECTO", "Retención en la fuente"],
  ["Transporte de leche", "INDIRECTO", "Transporte de leche e insumos"],
  ["Flete de insumos", "INDIRECTO", "Transporte de leche e insumos"],
  ["Gastos financieros", "INDIRECTO", "Gastos financieros"],
  ["Servicio técnico", "INDIRECTO", "Servicios técnicos"],
  ["Cuota de admisión", "INDIRECTO", "Otros gastos"],
  ["Fondo de estabilización de la leche", "INDIRECTO", "Otros gastos"],
  ["Otros gastos", "OTRO", "Otros gastos"],
] as const;

export const INSUMOS = [
  ["Fertileche levadura peletizado", "ALIMENTO", "BULTO", "Bulto x 40 kg"],
  ["Preparto peletizado", "ALIMENTO", "BULTO", "Bulto x 40 kg"],
  ["Forraje de maíz", "ALIMENTO", "BULTO", "Bulto x 50 kg"],
  ["Heno pangola", "ALIMENTO", "UNIDAD", "Paca"],
  ["Sal mineralizada 8 % lechería", "SAL", "BULTO", "Bulto x 40 kg"],
  ["Fertisal 4 %", "SAL", "BULTO", "Bulto x 40 kg"],
  ["Hematofos B12", "MEDICAMENTO", "ML", "Frasco x 100 ml"],
  ["Ganathion", "MEDICAMENTO", "ML", "Frasco x 30 ml"],
  ["Vacuna aftosa", "MEDICAMENTO", "DOSIS", "Frasco x 50 dosis"],
  ["Ivermectina 1 %", "MEDICAMENTO", "ML", "Frasco x 500 ml"],
  ["Semen bovino", "SEMEN", "DOSIS", "Pajilla"],
  ["Triple 15", "FERTILIZANTE", "BULTO", "Bulto x 50 kg"],
  ["Urea", "FERTILIZANTE", "BULTO", "Bulto x 50 kg"],
  ["Lorsban 4E", "OTRO", "L", "Litro"],
  ["Jabón neutro para equipo de ordeño", "OTRO", "GALON", "Galón"],
  ["Sellador de pezones", "OTRO", "GALON", "Galón"],
  ["Filtros de leche", "OTRO", "UNIDAD", "Paquete x 100"],
  ["ACPM", "COMBUSTIBLE", "GALON", "Galón"],
] as const;

/** Crea los catálogos base (BD vacía). Devuelve mapas nombre → id. */
export async function crearCatalogosBase(prisma: PrismaClient) {
  await prisma.raza.createMany({ data: RAZAS.map((nombre) => ({ nombre })) });
  const razas = new Map((await prisma.raza.findMany()).map((r) => [r.nombre, r.id]));

  await prisma.centroCosto.createMany({
    data: CENTROS_COSTO.map(([nombre, descripcion]) => ({ nombre, descripcion })),
  });
  const centros = new Map((await prisma.centroCosto.findMany()).map((c) => [c.nombre, c.id]));

  await prisma.rubroCosto.createMany({
    data: RUBROS.map(([nombre, grupo], orden) => ({ nombre, grupo, orden })),
  });
  const rubros = new Map((await prisma.rubroCosto.findMany()).map((r) => [r.nombre, r.id]));
  await prisma.categoriaGasto.createMany({
    data: CATEGORIAS_GASTO.map(([nombre, tipo, rubro]) => ({
      nombre,
      tipo,
      rubroId: rubros.get(rubro)!,
    })),
  });

  await prisma.insumo.createMany({
    data: INSUMOS.map(([nombre, tipo, unidad, presentacion]) => ({
      nombre,
      tipo,
      unidad,
      presentacion,
    })),
  });

  return { razas, centros, rubros };
}
