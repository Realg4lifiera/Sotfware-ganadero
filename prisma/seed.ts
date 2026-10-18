/**
 * Datos de prueba: dos fincas. "Finca Campo Verde" con potreros, lotes, ~45 animales con
 * genealogía coherente (3 generaciones), toros y pajillas; "Finca La Esperanza" más
 * pequeña. Un usuario por rol (mayordomo, veterinario, contador y propietario con acceso a
 * Campo Verde; el administrador ve todas) y catálogos colombianos compartidos.
 *
 * Las fechas son relativas al día en que se corre el seed, para que las edades y
 * categorías tengan sentido siempre. Ejecuta: `npm run db:reset` (BD vacía).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, type EstadoReproductivo, type Sexo } from "../src/generated/prisma/client";
import { conFinca, contextoFinca, extensionFinca } from "../src/lib/finca";
import { calcularCategoria, type CategoriaAnimal } from "../src/lib/dominio/categoria";
import { hoy } from "../src/lib/fechas";
import { crearCatalogosGlobales, crearCentrosFinca } from "./catalogos-base";

// Con la extensión de finca: dentro de conFinca() cada registro queda en su finca.
const base = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const prisma = base.$extends(extensionFinca);
/** Finca del contexto: las creaciones anidadas no pasan por la extensión y la llevan explícita. */
const fincaSeed = () => contextoFinca.getStore()!.fincaId!;

const HOY = hoy();
const haceDias = (d: number) => new Date(HOY.getTime() - d * 86_400_000);
const CLAVE_PRUEBA = "ganadero123";

// ── Animales ─────────────────────────────────────────────────────────────────

type Toro = "HO1" | "HO2" | "JE1" | "NO1" | "GY1" | "PROPIO";

const TOROS: Record<Toro, { nombre: string; codigo: string; raza: string; propio: boolean }> = {
  HO1: { nombre: "Ébano", codigo: "HO-1187", raza: "Holstein", propio: false },
  HO2: { nombre: "Galán", codigo: "HO-2230", raza: "Holstein", propio: false },
  JE1: { nombre: "Valiente", codigo: "JE-0415", raza: "Jersey", propio: false },
  NO1: { nombre: "Capitán", codigo: "NO-0902", raza: "Normando", propio: false },
  GY1: { nombre: "Sultán", codigo: "GY-0331", raza: "Gyr", propio: false },
  PROPIO: { nombre: "Tiburón", codigo: "401", raza: "Normando", propio: true },
};

/** Vacas fundadoras compradas: [número, nombre, raza, edad en años, partos previos]. */
const FUNDADORAS = [
  ["101", "Margarita", "Holstein", 9, 4],
  ["102", "Clavellina", "Holstein", 8, 3],
  ["103", "Mariela", "Jersey", 8, 3],
  ["104", "Pinta", "Holstein", 9, 4],
  ["105", "Bonita", "Normando", 10, 5],
  ["106", "Golondrina", "Holstein", 7, 2],
  ["107", "Morena", "Gyrolando (Holstein × Gyr)", 8, 3],
  ["108", "Princesa", "Holstein", 7, 2],
  ["109", "Manchas", "Jersolando (Jersey × Holstein)", 7, 2],
  ["110", "Lupita", "Holstein", 8, 3],
  ["111", "Rosita", "Normando × Holstein", 9, 4],
  ["112", "Negra", "Holstein", 11, 6],
  ["113", "Orquídea", "Gyr", 9, 4],
] as const;

/** Nacimientos en la finca: [número, nombre, sexo, madre, toro, hace cuántos días]. */
const NACIMIENTOS: [string, string, Sexo, string, Toro, number][] = [
  // Generación 1 (hijas de las fundadoras)
  ["201", "Lucero", "HEMBRA", "101", "HO1", 1650],
  ["202", "Estrella", "HEMBRA", "102", "HO2", 1600],
  ["203", "Paloma", "HEMBRA", "103", "JE1", 1500],
  ["204", "Mariposa", "HEMBRA", "104", "HO1", 1420],
  ["205", "Gaviota", "HEMBRA", "105", "NO1", 1350],
  ["206", "Azucena", "HEMBRA", "106", "HO2", 1300],
  ["207", "Canela", "HEMBRA", "107", "GY1", 830],
  ["208", "Violeta", "HEMBRA", "108", "HO1", 800],
  ["209", "Perla", "HEMBRA", "109", "JE1", 760],
  ["210", "Rubí", "HEMBRA", "110", "HO2", 560],
  ["211", "Brisa", "HEMBRA", "111", "NO1", 500],
  ["212", "Dalia", "HEMBRA", "112", "HO1", 450],
  ["213", "Lucas", "MACHO", "101", "NO1", 420],
  ["214", "Pepe", "MACHO", "103", "PROPIO", 400],
  // Generación 2 (nietas de las fundadoras y crías recientes)
  ["301", "Luna", "HEMBRA", "201", "HO1", 40],
  ["302", "Nube", "HEMBRA", "202", "JE1", 95],
  ["303", "Sol", "MACHO", "203", "HO2", 150],
  ["304", "Flor", "HEMBRA", "204", "HO1", 200],
  ["305", "Tormenta", "MACHO", "205", "PROPIO", 260],
  ["306", "Lila", "HEMBRA", "206", "HO2", 330],
  ["307", "Kiara", "HEMBRA", "101", "HO1", 20],
  ["308", "Toby", "MACHO", "102", "PROPIO", 70],
  ["309", "Mora", "HEMBRA", "104", "JE1", 130],
  ["310", "Chispa", "HEMBRA", "105", "HO1", 180],
  ["311", "Rocky", "MACHO", "106", "NO1", 240],
  ["312", "Nina", "HEMBRA", "107", "GY1", 280],
  ["313", "Bruno", "MACHO", "108", "PROPIO", 310],
  ["314", "Tita", "HEMBRA", "109", "HO1", 50],
  ["315", "Kira", "HEMBRA", "110", "HO2", 110],
  ["316", "Max", "MACHO", "111", "NO1", 160],
];

/** Días de lactancia hasta el secado en el seed. */
const DURACION_LACTANCIA = 300;

async function main() {
  if (await prisma.finca.findFirst()) {
    console.log("La base de datos ya tiene datos. Usa `npm run db:reset` para empezar de cero.");
    return;
  }

  // ── Finca, usuarios y catálogos ────────────────────────────────────────────
  const campoVerde = await prisma.finca.create({
    data: {
      nombre: "Finca Campo Verde",
      codigo: "P01",
      propietario: "Propietario de prueba",
      departamento: "Antioquia",
      municipio: "San Pedro de los Milagros",
      vereda: "La Lana",
      areaTotalHa: "42.50",
      areaUtilHa: "36.00",
      tipoOrdeno: "Mecánico en potrero",
      configuracion: {
        hato: {
          edadDesteteMeses: 8,
          edadNovillaMeses: 12,
          porcentajeIdeal: {
            VACA_PRODUCCION: 50,
            VACA_SECA: 15,
            NOVILLA: 20,
            TERNERA: 15,
            TERNERA_LACTANTE: 0,
          },
        },
      },
    },
  });

  const hash = await bcrypt.hash(CLAVE_PRUEBA, 10);
  await prisma.usuario.createMany({
    data: [
      { nombre: "Administrador", usuario: "admin", rol: "ADMIN", passwordHash: hash },
      { nombre: "Mayordomo", usuario: "mayordomo", rol: "MAYORDOMO", passwordHash: hash },
      { nombre: "Veterinario", usuario: "veterinario", rol: "VETERINARIO", passwordHash: hash },
      { nombre: "Contador", usuario: "contador", rol: "CONTADOR", passwordHash: hash },
      { nombre: "Propietario", usuario: "propietario", rol: "PROPIETARIO", passwordHash: hash },
    ],
  });
  const laEsperanza = await prisma.finca.create({
    data: {
      nombre: "Finca La Esperanza",
      codigo: "P02",
      propietario: "Otro propietario de prueba",
      departamento: "Antioquia",
      municipio: "Entrerríos",
      areaTotalHa: "18.00",
      areaUtilHa: "15.00",
      tipoOrdeno: "Manual",
    },
  });
  // El administrador ve todas las fincas; los demás, Campo Verde.
  for (const u of await prisma.usuario.findMany({ where: { rol: { not: "ADMIN" } } }))
    await prisma.usuarioFinca.create({ data: { usuarioId: u.id, fincaId: campoVerde.id } });

  const { razas } = await crearCatalogosGlobales(base);

  await prisma.proveedor.createMany({
    data: [
      { nombre: "Almacén de la cooperativa", nit: "890900000-1", telefono: "6040000000" },
      { nombre: "Agropecuaria El Ordeño", nit: "900111222-3", telefono: "3000000001" },
      { nombre: "Veterinaria San Pedro", nit: "900333444-5", telefono: "3000000002" },
      { nombre: "Genética Bovina S.A.S.", nit: "900555666-7", telefono: "3000000003" },
    ],
  });
  const proveedorGenetica = await prisma.proveedor.findUniqueOrThrow({
    where: { nombre: "Genética Bovina S.A.S." },
  });

  await conFinca(laEsperanza.id, () => sembrarLaEsperanza(razas));
  await conFinca(campoVerde.id, () => sembrarCampoVerde(razas, proveedorGenetica.id));
}

/** Finca pequeña de prueba para ver el aislamiento entre fincas. */
async function sembrarLaEsperanza(razas: Map<string, string>) {
  const centros = await crearCentrosFinca(prisma);
  await prisma.comprador.create({ data: { nombre: "Cooperativa lechera", nit: "890900000-1" } });
  const lote = await prisma.lote.create({ data: { nombre: "Lote único", proposito: "LECHERIA" } });
  const potrero = await prisma.potrero.create({
    data: { nombre: "El Llano", areaHa: "15.00", tipoPasto: "Kikuyo" },
  });
  await prisma.ocupacionPotrero.create({
    data: { loteId: lote.id, potreroId: potrero.id, fechaEntrada: haceDias(10) },
  });
  const vacas: [string, string, number][] = [
    ["101", "Paloma", 2],
    ["102", "Luna", 3],
    ["103", "Canela", 1],
    ["104", "Estrella", 4],
    ["105", "Morena", 2],
  ];
  for (const [numero, nombre, partos] of vacas) {
    const a = await prisma.animal.create({
      data: {
        numero,
        nombre,
        sexo: "HEMBRA",
        razaId: razas.get("Normando"),
        fechaNacimiento: haceDias(365 * (2 + partos)),
        origen: "COMPRADO",
        fechaIngreso: haceDias(400),
        loteId: lote.id,
        potreroId: potrero.id,
        estadoReproductivo: "PARIDA",
        numeroPartos: partos,
      },
    });
    await prisma.movimientoAnimal.create({
      data: { animalId: a.id, tipo: "COMPRA", fecha: haceDias(400), valor: "4200000" },
    });
    await prisma.lactancia.create({
      data: { vacaId: a.id, numero: partos, fechaInicio: haceDias(60 + (Number(numero) % 5) * 20) },
    });
  }
  const comprador = await prisma.comprador.findFirstOrThrow();
  for (let d = 1; d <= 20; d++)
    await prisma.entregaLeche.create({
      data: { fecha: haceDias(d), compradorId: comprador.id, litros: "62", precioLitro: "2150" },
    });
  const categoria = await prisma.categoriaGasto.findFirstOrThrow({
    where: { nombre: "Sales mineralizadas" },
  });
  await prisma.gasto.create({
    data: {
      fecha: haceDias(12),
      descripcion: "Sal mineralizada 8 %",
      categoriaId: categoria.id,
      centroCostoId: centros.get("Lechería")!,
      cantidad: "4",
      valorUnitario: "98000",
      valorTotal: "392000",
    },
  });
}

/** Finca principal de prueba (los datos de siempre). */
async function sembrarCampoVerde(razas: Map<string, string>, proveedorGeneticaId: string) {
  const centros = await crearCentrosFinca(prisma);
  await prisma.comprador.createMany({
    data: [
      { nombre: "Cooperativa lechera", nit: "890900000-1" },
      { nombre: "Comprador de ganado particular" },
      { nombre: "Subasta ganadera" },
    ],
  });
  const compradorGanado = await prisma.comprador.findFirstOrThrow({
    where: { nombre: "Comprador de ganado particular" },
  });

  await prisma.trabajador.createMany({
    data: [
      {
        nombre: "Trabajador 1",
        cargo: "Ordeñador",
        tipoContrato: "SIN_PRESTACIONES",
        salarioBase: "2175000",
        fechaIngreso: haceDias(900),
      },
      {
        nombre: "Reemplazo",
        cargo: "Ordeñador de reemplazo",
        tipoContrato: "SIN_PRESTACIONES",
        salarioBase: "360000",
        eventual: true,
      },
      {
        nombre: "Jornales extras",
        cargo: "Jornalero",
        tipoContrato: "SIN_PRESTACIONES",
        salarioBase: "200000",
        eventual: true,
      },
    ],
  });

  await prisma.reglaProrrateo.create({
    data: {
      nombre: "General de la finca",
      descripcion: "Reparto de costos indirectos entre centros de costo",
      detalles: {
        create: [
          { fincaId: fincaSeed(), centroCostoId: centros.get("Lechería")!, porcentaje: "75" },
          { fincaId: fincaSeed(), centroCostoId: centros.get("Cría y levante")!, porcentaje: "15" },
          { fincaId: fincaSeed(), centroCostoId: centros.get("Pasturas")!, porcentaje: "10" },
        ],
      },
    },
  });
  await prisma.activo.create({
    data: {
      nombre: "Equipo de ordeño mecánico",
      valorCompra: "18000000",
      fechaCompra: haceDias(1100),
      vidaUtilMeses: 120,
      valorResidual: "2000000",
      centroCostoId: centros.get("Lechería")!,
    },
  });

  // ── Potreros y lotes ───────────────────────────────────────────────────────
  const potreros = {
    alto: await prisma.potrero.create({
      data: { nombre: "P1 El Alto", areaHa: "8.50", tipoPasto: "Kikuyo" },
    }),
    quebrada: await prisma.potrero.create({
      data: { nombre: "P2 La Quebrada", areaHa: "7.00", tipoPasto: "Kikuyo y raigrás" },
    }),
    plan: await prisma.potrero.create({
      data: { nombre: "P3 El Plan", areaHa: "9.00", tipoPasto: "Raigrás" },
    }),
    loma: await prisma.potrero.create({
      data: { nombre: "P4 La Loma", areaHa: "6.50", tipoPasto: "Kikuyo" },
    }),
    maternidad: await prisma.potrero.create({
      data: { nombre: "P5 Maternidad", areaHa: "2.00", tipoPasto: "Kikuyo y trébol" },
    }),
  };
  const lotes = {
    produccion: await prisma.lote.create({
      data: { nombre: "Lote 1 · Producción", proposito: "LECHERIA" },
    }),
    secas: await prisma.lote.create({
      data: { nombre: "Lote 2 · Horras y secas", proposito: "LECHERIA" },
    }),
    levante: await prisma.lote.create({
      data: { nombre: "Lote 3 · Levante", proposito: "LEVANTE" },
    }),
    terneras: await prisma.lote.create({
      data: { nombre: "Lote 4 · Terneras", proposito: "CRIA" },
    }),
  };
  const ubicacion: Record<CategoriaAnimal, { loteId: string | null; potreroId: string }> = {
    VACA_PRODUCCION: { loteId: lotes.produccion.id, potreroId: potreros.alto.id },
    TORO: { loteId: lotes.produccion.id, potreroId: potreros.alto.id },
    VACA_SECA: { loteId: lotes.secas.id, potreroId: potreros.quebrada.id },
    NOVILLA: { loteId: lotes.levante.id, potreroId: potreros.plan.id },
    MACHO_LEVANTE_CEBA: { loteId: lotes.levante.id, potreroId: potreros.plan.id },
    TERNERA: { loteId: lotes.terneras.id, potreroId: potreros.maternidad.id },
    TERNERA_LACTANTE: { loteId: lotes.terneras.id, potreroId: potreros.maternidad.id },
    OTRA_ESPECIE: { loteId: null, potreroId: potreros.loma.id },
  };
  await prisma.ocupacionPotrero.createMany({
    data: [
      [lotes.produccion.id, potreros.alto.id],
      [lotes.secas.id, potreros.quebrada.id],
      [lotes.levante.id, potreros.plan.id],
      [lotes.terneras.id, potreros.maternidad.id],
    ].map(([loteId, potreroId]) => ({ loteId, potreroId, fechaEntrada: haceDias(12) })),
  });

  // ── Toros y pajillas ───────────────────────────────────────────────────────
  const toroPropio = await prisma.animal.create({
    data: {
      numero: "401",
      nombre: "Tiburón",
      sexo: "MACHO",
      razaId: razas.get("Normando"),
      fechaNacimiento: haceDias(365 * 5),
      origen: "COMPRADO",
      fechaIngreso: haceDias(365 * 3),
    },
  });
  const toros = {} as Record<Toro, string>;
  const pajillas = {} as Partial<Record<Toro, string>>;
  for (const [clave, t] of Object.entries(TOROS) as [Toro, (typeof TOROS)[Toro]][]) {
    const toro = await prisma.toro.create({
      data: {
        nombre: t.nombre,
        codigo: t.codigo,
        razaId: razas.get(t.raza),
        propio: t.propio,
        animalId: t.propio ? toroPropio.id : null,
      },
    });
    toros[clave] = toro.id;
    if (!t.propio) {
      const p = await prisma.pajilla.create({
        data: {
          toroId: toro.id,
          razaId: razas.get(t.raza),
          proveedorId: proveedorGeneticaId,
          codigo: `${t.codigo}-L1`,
          ubicacionTermo: "Termo 1",
          existencias: 15,
          valorUnitario: "45000",
          movimientos: {
            create: {
              fincaId: fincaSeed(),
              tipo: "ENTRADA",
              fecha: haceDias(400),
              cantidad: 15,
              nota: "Compra inicial",
            },
          },
        },
      });
      pajillas[clave] = p.id;
    }
  }

  // ── Fundadoras ─────────────────────────────────────────────────────────────
  const ids = new Map<string, string>();
  const info = new Map<
    string,
    { sexo: Sexo; nacimiento: Date; partosPrevios: number; partos: { id: string; fecha: Date }[] }
  >();
  for (const [numero, nombre, raza, edad, partosPrevios] of FUNDADORAS) {
    const fechaIngreso = haceDias(365 * 6 + Number(numero) * 3);
    const nacimiento = haceDias(Math.round(365.25 * edad));
    const a = await prisma.animal.create({
      data: {
        numero,
        nombre,
        sexo: "HEMBRA",
        razaId: razas.get(raza),
        fechaNacimiento: nacimiento,
        fechaNacimientoEstimada: true,
        origen: "COMPRADO",
        fechaIngreso,
        movimientos: {
          create: {
            fincaId: fincaSeed(),
            tipo: "COMPRA",
            fecha: fechaIngreso,
            valor: "4500000",
            motivo: "Compra de vientre",
          },
        },
      },
    });
    ids.set(numero, a.id);
    info.set(numero, { sexo: "HEMBRA", nacimiento, partosPrevios, partos: [] });
  }
  await prisma.movimientoAnimal.create({
    data: {
      animalId: toroPropio.id,
      tipo: "COMPRA",
      fecha: toroPropio.fechaIngreso,
      valor: "8000000",
      motivo: "Toro reproductor",
    },
  });
  info.set("401", {
    sexo: "MACHO",
    nacimiento: toroPropio.fechaNacimiento!,
    partosPrevios: 0,
    partos: [],
  });
  ids.set("401", toroPropio.id);

  // ── Nacimientos (en orden cronológico): parto + cría ───────────────────────
  for (const [numero, nombre, sexo, madre, toro, dias] of [...NACIMIENTOS].sort(
    (a, b) => b[5] - a[5],
  )) {
    const fecha = haceDias(dias);
    const madreId = ids.get(madre)!;
    const parto = await prisma.parto.create({
      data: { hembraId: madreId, fecha, tipo: "NORMAL", toroId: toros[toro] },
    });
    const madreRaza = (await prisma.animal.findUniqueOrThrow({ where: { id: madreId } })).razaId;
    const cria = await prisma.animal.create({
      data: {
        numero,
        nombre,
        sexo,
        razaId:
          TOROS[toro].raza === "Holstein" && madreRaza === razas.get("Holstein")
            ? madreRaza
            : razas.get("Cruce"),
        fechaNacimiento: fecha,
        origen: "NACIDO",
        fechaIngreso: fecha,
        pesoNacimientoKg: sexo === "MACHO" ? "38" : "34",
        madreId,
        padreId: toros[toro],
        partoId: parto.id,
      },
    });
    ids.set(numero, cria.id);
    info.set(numero, { sexo, nacimiento: fecha, partosPrevios: 0, partos: [] });
    info.get(madre)!.partos.push({ id: parto.id, fecha });
  }

  // Caballo de trabajo (otras especies).
  const caballo = await prisma.animal.create({
    data: {
      numero: "E01",
      nombre: "Canelo",
      especie: "EQUINO",
      sexo: "MACHO",
      razaId: razas.get("Criollo (equino)"),
      fechaNacimiento: haceDias(365 * 8),
      fechaNacimientoEstimada: true,
      origen: "COMPRADO",
      fechaIngreso: haceDias(365 * 4),
      ...ubicacion.OTRA_ESPECIE,
    },
  });
  await prisma.movimientoAnimal.create({
    data: { animalId: caballo.id, tipo: "COMPRA", fecha: caballo.fechaIngreso, valor: "3500000" },
  });

  // ── Estado reproductivo, lactancias, servicios y diagnósticos ──────────────
  let numeroServicio = 0;
  const servir = async (hembraId: string, fecha: Date, toro: Toro, prenada: boolean) => {
    numeroServicio++;
    const inseminacion = toro !== "PROPIO";
    const servicio = await prisma.servicio.create({
      data: {
        hembraId,
        fecha,
        tipo: inseminacion ? "INSEMINACION" : "MONTA_NATURAL",
        // El padre queda en el servicio también en inseminación (es el toro de la pajilla).
        toroId: toros[toro],
        pajillaId: inseminacion ? pajillas[toro] : null,
        inseminador: inseminacion ? "Inseminador de la cooperativa" : null,
        numeroServicio: 1,
      },
    });
    if (inseminacion) {
      await prisma.movimientoPajilla.create({
        data: {
          pajillaId: pajillas[toro]!,
          tipo: "USO",
          fecha,
          cantidad: -1,
          servicioId: servicio.id,
        },
      });
      await prisma.pajilla.update({
        where: { id: pajillas[toro]! },
        data: { existencias: { decrement: 1 } },
      });
    }
    if (prenada) {
      const fechaDx = new Date(fecha.getTime() + 45 * 86_400_000);
      await prisma.diagnosticoPrenez.create({
        data: {
          hembraId,
          fecha: fechaDx,
          metodo: numeroServicio % 2 ? "PALPACION" : "ECOGRAFIA",
          resultado: "PRENADA",
          diasGestacion: 45,
          fechaProbableParto: new Date(fecha.getTime() + 283 * 86_400_000),
          servicioId: servicio.id,
          veterinario: "Veterinario de la finca",
        },
      });
    }
  };
  const torosIA: Toro[] = ["HO1", "HO2", "JE1", "NO1", "GY1", "PROPIO"];

  for (const [numero, datos] of info) {
    if (datos.sexo !== "HEMBRA") continue;
    const id = ids.get(numero)!;
    const ultimo = datos.partos.at(-1);
    const numeroPartos = datos.partosPrevios + datos.partos.length;
    const toro = torosIA[Number(numero) % torosIA.length];
    let estado: EstadoReproductivo = "NOVILLA";

    if (ultimo || numeroPartos > 0) {
      const diasDesdeParto = ultimo
        ? Math.round((HOY.getTime() - ultimo.fecha.getTime()) / 86_400_000)
        : 400;
      const numeroLactancia = numeroPartos;
      if (diasDesdeParto <= DURACION_LACTANCIA) {
        await prisma.lactancia.create({
          data: {
            vacaId: id,
            partoId: ultimo?.id,
            numero: numeroLactancia,
            fechaInicio: ultimo!.fecha,
          },
        });
        if (diasDesdeParto < 60) estado = "PARIDA";
        else if (diasDesdeParto < 120) {
          estado = "SERVIDA";
          await servir(id, haceDias(diasDesdeParto - 65), toro, false);
        } else {
          estado = "PRENADA";
          await servir(id, haceDias(diasDesdeParto - 80), toro, true);
        }
      } else {
        // Vaca seca y preñada: la lactancia se cerró con un secado.
        if (ultimo) {
          const fin = new Date(ultimo.fecha.getTime() + DURACION_LACTANCIA * 86_400_000);
          const lactancia = await prisma.lactancia.create({
            data: {
              vacaId: id,
              partoId: ultimo.id,
              numero: numeroLactancia,
              fechaInicio: ultimo.fecha,
              fechaFin: fin,
            },
          });
          await prisma.secado.create({
            data: { hembraId: id, fecha: fin, lactanciaId: lactancia.id },
          });
        }
        estado = "SECA";
        await servir(id, haceDias(Math.min(diasDesdeParto - 90, 220)), toro, true);
      }
    } else {
      const meses = (HOY.getTime() - datos.nacimiento.getTime()) / (30.44 * 86_400_000);
      if (meses >= 24) {
        estado = "PRENADA";
        await servir(id, haceDias(100), toro, true);
      } else if (meses >= 18) {
        estado = "SERVIDA";
        await servir(id, haceDias(20), toro, false);
      }
    }

    const lactanciaAbierta = !!(await prisma.lactancia.findFirst({
      where: { vacaId: id, fechaFin: null },
    }));
    const categoria = calcularCategoria(
      {
        especie: "BOVINO",
        sexo: "HEMBRA",
        fechaNacimiento: datos.nacimiento,
        numeroPartos,
        lactanciaAbierta,
        esToro: false,
      },
      HOY,
    );
    await prisma.animal.update({
      where: { id },
      data: { estadoReproductivo: estado, numeroPartos, ...ubicacion[categoria] },
    });
  }

  // Machos: lote según categoría.
  for (const [numero, datos] of info) {
    if (datos.sexo !== "MACHO") continue;
    const esToro = numero === "401";
    const meses = (HOY.getTime() - datos.nacimiento.getTime()) / (30.44 * 86_400_000);
    const destino = esToro
      ? ubicacion.TORO
      : meses < 8
        ? ubicacion.TERNERA_LACTANTE
        : ubicacion.MACHO_LEVANTE_CEBA;
    await prisma.animal.update({ where: { id: ids.get(numero)! }, data: destino });
  }

  // ── Pesajes de crías y levante ─────────────────────────────────────────────
  for (const [numero, , sexo, , , dias] of NACIMIENTOS) {
    if (dias > 900) continue;
    const animal = await prisma.animal.findUniqueOrThrow({ where: { id: ids.get(numero)! } });
    const nacer = sexo === "MACHO" ? 38 : 34;
    const gdp = sexo === "MACHO" ? 0.62 : 0.55; // kg/día
    for (const hace of [Math.round(dias / 2), 15]) {
      if (hace >= dias) continue;
      await prisma.pesaje.create({
        data: {
          animalId: animal.id,
          fecha: haceDias(hace),
          pesoKg: (nacer + gdp * (dias - hace)).toFixed(1),
          metodo: dias - hace > 240 ? "BASCULA" : "CINTA",
          loteId: animal.loteId,
        },
      });
    }
  }

  // ── Salidas: una venta de descarte y una muerte ────────────────────────────
  const negra = ids.get("112")!;
  const venta = await prisma.movimientoAnimal.create({
    data: {
      animalId: negra,
      tipo: "VENTA",
      fecha: haceDias(45),
      motivo: "Descarte por edad",
      valor: "1400000",
      pesoKg: "480",
      compradorId: compradorGanado.id,
      loteOrigenId: lotes.secas.id,
    },
  });
  await prisma.ingreso.create({
    data: {
      tipo: "VENTA_ANIMAL",
      concepto: "Animales de descarte",
      fecha: venta.fecha,
      compradorId: compradorGanado.id,
      cantidad: "1",
      precioUnitario: "1400000",
      total: "1400000",
      animalId: negra,
      movimientoAnimalId: venta.id,
      centroCostoId: centros.get("Lechería")!,
    },
  });
  await prisma.lactancia.updateMany({
    where: { vacaId: negra, fechaFin: null },
    data: { fechaFin: venta.fecha },
  });
  await prisma.animal.update({
    where: { id: negra },
    data: { estado: "VENDIDO", fechaSalida: venta.fecha, loteId: null, potreroId: null },
  });

  const max = ids.get("316")!;
  const muerte = await prisma.movimientoAnimal.create({
    data: { animalId: max, tipo: "MUERTE", fecha: haceDias(30), motivo: "Neumonía" },
  });
  await prisma.animal.update({
    where: { id: max },
    data: { estado: "MUERTO", fechaSalida: muerte.fecha, loteId: null, potreroId: null },
  });

  const total = await prisma.animal.count();
  const activos = await prisma.animal.count({ where: { estado: "ACTIVO" } });
  console.log(`Seed listo: Campo Verde con ${total} animales (${activos} activos) y La Esperanza.`);
  console.log(
    `Usuarios: admin (todas las fincas), mayordomo, veterinario, contador y propietario (Campo Verde) — contraseña "${CLAVE_PRUEBA}".`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => base.$disconnect());
