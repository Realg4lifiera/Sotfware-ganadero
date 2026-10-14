/**
 * Mapa de navegación: módulos, páginas, permisos y descripción del alcance de cada una.
 * El menú se filtra por rol con estos permisos (y cada página vuelve a validarlo).
 * Las páginas con `estado: "proximamente"` existen y muestran su alcance; se construyen
 * en los módulos siguientes.
 */
import type { Rol } from "@/generated/prisma/enums";
import { puedeAlguno, type Permiso } from "@/lib/permisos";

export type NombreIcono =
  | "tablero"
  | "animales"
  | "importar"
  | "costos"
  | "gasto"
  | "nomina"
  | "administrativo"
  | "activo"
  | "ingreso"
  | "presupuesto"
  | "indicador"
  | "reproduccion"
  | "celo"
  | "servicio"
  | "diagnostico"
  | "parto"
  | "aborto"
  | "secado"
  | "descarte"
  | "pajilla"
  | "genealogia"
  | "alerta"
  | "produccion"
  | "ordeno"
  | "lactancia"
  | "entrega"
  | "consumo"
  | "pesaje"
  | "ganancia"
  | "potrero"
  | "alimentacion"
  | "sanidad"
  | "reportes"
  | "informe"
  | "inventario"
  | "configuracion"
  | "finca"
  | "usuarios"
  | "lote"
  | "raza"
  | "centro"
  | "categoria"
  | "proveedor"
  | "comprador"
  | "insumo"
  | "toro"
  | "trabajador"
  | "auditoria";

export interface PaginaNav {
  titulo: string;
  href: string;
  icono: NombreIcono;
  /** Basta con tener uno de estos permisos para ver la página. */
  permisos: Permiso[];
  descripcion: string;
  /** Funcionalidades del alcance (se muestran mientras la página está "Próximamente"). */
  alcance?: string[];
  estado?: "lista" | "proximamente";
  /** Formulario de campo rápido (aparece en "Registrar" del menú del celular). */
  registroRapido?: boolean;
  /** Destino del registro rápido (por defecto `href`). */
  hrefRapido?: string;
}

export interface SeccionNav {
  titulo: string;
  icono: NombreIcono;
  paginas: PaginaNav[];
}

export const NAVEGACION: SeccionNav[] = [
  {
    titulo: "Inicio",
    icono: "tablero",
    paginas: [
      {
        titulo: "Tablero",
        href: "/tablero",
        icono: "tablero",
        permisos: ["tablero:ver"],
        descripcion: "Resumen del hato, la leche, los costos y las alertas.",
        estado: "lista",
      },
      {
        titulo: "Animales",
        href: "/animales",
        icono: "animales",
        permisos: ["animal:leer"],
        descripcion: "Inventario, hoja de vida y movimientos de cada animal.",
        estado: "lista",
      },
      {
        titulo: "Importar animales",
        href: "/animales/importar",
        icono: "importar",
        permisos: ["animal:importar"],
        descripcion: "Carga masiva del inventario desde la plantilla de Excel.",
        estado: "lista",
      },
    ],
  },
  {
    titulo: "Costos",
    icono: "costos",
    paginas: [
      {
        titulo: "Compras y gastos",
        href: "/costos/gastos",
        icono: "gasto",
        permisos: ["costos:leer", "gasto:registrar"],
        descripcion: "Compras de insumos y gastos directos, con soporte adjunto.",
        alcance: [
          "Registro de compras: artículo, presentación, unidad, cantidad, valor unitario, descuento e IVA",
          "Origen de la compra: almacén de la cooperativa o compra externa",
          "Proveedor, categoría, centro de costo y número de factura",
          "Foto o PDF del soporte",
          "Asignación directa opcional a un animal o a un lote",
          "Registro rápido de gastos de campo desde el celular",
        ],
        registroRapido: true,
        hrefRapido: "/costos/gastos/nuevo",
        estado: "lista",
      },
      {
        titulo: "Nómina",
        href: "/costos/nomina",
        icono: "nomina",
        permisos: ["costos:leer"],
        estado: "lista",
        descripcion: "Pagos de mano de obra por trabajador y reporte mensual.",
        alcance: [
          "Pagos: salario, auxilio de transporte, salud, pensión, ARL, prima, vacaciones, cesantías, intereses y bonificación",
          "Costo total calculado por pago",
          "Trabajadores fijos y eventuales (reemplazos, jornales extras)",
          "Reporte mensual: empleados, salario base, bonificaciones, prestaciones y costo total",
        ],
      },
      {
        titulo: "Gastos administrativos",
        href: "/costos/administrativos",
        icono: "administrativo",
        permisos: ["costos:leer"],
        estado: "lista",
        descripcion: "Costos indirectos con período y prorrateo entre centros de costo.",
        alcance: [
          "Impuesto predial, servicios públicos, arriendo y gastos financieros",
          "Mantenimiento de equipo, fletes, transporte de leche (con litros), retención en la fuente, servicio técnico, cuota de admisión y fondo de estabilización",
          "Período del gasto (mensual a anual) repartido por mes",
          "Reglas de prorrateo entre centros de costo",
        ],
      },
      {
        titulo: "Activos y depreciación",
        href: "/costos/activos",
        icono: "activo",
        permisos: ["costos:leer"],
        estado: "lista",
        descripcion: "Maquinaria y equipos con su depreciación mensual.",
        alcance: [
          "Valor de compra, fecha, vida útil y valor residual",
          "Cálculo automático de la depreciación mensual",
        ],
      },
      {
        titulo: "Ingresos",
        href: "/costos/ingresos",
        icono: "ingreso",
        permisos: ["costos:leer"],
        descripcion: "Venta de leche, venta de animales y otros ingresos.",
        alcance: [
          "Venta de leche por período y comprador",
          "Venta de animales (se genera sola desde el movimiento de venta)",
          "Otros ingresos: terneros, animales de descarte, etc.",
        ],
      },
      {
        titulo: "Presupuesto",
        href: "/costos/presupuesto",
        icono: "presupuesto",
        permisos: ["costos:leer"],
        descripcion: "Presupuesto mensual por categoría y su ejecución.",
        alcance: [
          "Presupuesto por año, mes y categoría",
          "Comparativo presupuestado vs. ejecutado",
        ],
      },
      {
        titulo: "Indicadores de costo",
        href: "/costos/indicadores",
        icono: "indicador",
        permisos: ["costos:leer"],
        descripcion: "Costo por litro, por kilo ganado y por animal/día.",
        alcance: [
          "Costo por litro producido y por litro vendido",
          "Costo por kilo ganado (ceba y levante)",
          "Costo por animal/día",
          "Participación de cada rubro en el costo total",
        ],
      },
    ],
  },
  {
    titulo: "Reproducción",
    icono: "reproduccion",
    paginas: [
      {
        titulo: "Celos",
        href: "/reproduccion/celos",
        icono: "celo",
        permisos: ["reproduccion:leer"],
        descripcion: "Detección de celos.",
        alcance: ["Registro rápido de celo con fecha y hora", "Historial por hembra"],
        registroRapido: true,
      },
      {
        titulo: "Servicios",
        href: "/reproduccion/servicios",
        icono: "servicio",
        permisos: ["reproduccion:leer"],
        descripcion: "Montas naturales e inseminaciones.",
        alcance: [
          "Monta natural (toro) o inseminación (pajilla, descuenta existencias)",
          "Inseminador y número de servicio",
        ],
      },
      {
        titulo: "Diagnósticos de preñez",
        href: "/reproduccion/diagnosticos",
        icono: "diagnostico",
        permisos: ["reproduccion:leer"],
        descripcion: "Palpaciones y ecografías.",
        alcance: ["Método, resultado, días de gestación y veterinario", "Fecha probable de parto"],
      },
      {
        titulo: "Partos",
        href: "/reproduccion/partos",
        icono: "parto",
        permisos: ["reproduccion:leer"],
        descripcion: "Partos y registro automático de las crías.",
        alcance: [
          "Tipo de parto y crías (sexo y peso)",
          "Cada cría se crea como animal con madre y padre",
          "Abre la lactancia de la vaca",
        ],
      },
      {
        titulo: "Abortos",
        href: "/reproduccion/abortos",
        icono: "aborto",
        permisos: ["reproduccion:leer"],
        descripcion: "Registro de abortos y su causa.",
        alcance: ["Fecha, causa y días de gestación"],
      },
      {
        titulo: "Secados",
        href: "/reproduccion/secados",
        icono: "secado",
        permisos: ["reproduccion:leer"],
        descripcion: "Secado de vacas (cierra la lactancia).",
        alcance: ["Fecha de secado", "Cierre automático de la lactancia"],
      },
      {
        titulo: "Descartes",
        href: "/reproduccion/descartes",
        icono: "descarte",
        permisos: ["reproduccion:leer"],
        descripcion: "Descarte por causas reproductivas.",
        alcance: ["Fecha y motivo del descarte"],
      },
      {
        titulo: "Pajillas",
        href: "/reproduccion/pajillas",
        icono: "pajilla",
        permisos: ["reproduccion:leer"],
        descripcion: "Inventario del termo: entradas y usos de pajillas.",
        alcance: ["Existencias por toro", "Entradas, usos y ajustes"],
      },
      {
        titulo: "Genealogía",
        href: "/reproduccion/genealogia",
        icono: "genealogia",
        permisos: ["reproduccion:leer"],
        descripcion: "Árbol genealógico y descendencia por toro.",
        alcance: [
          "Árbol de padres y abuelos",
          "Hijas por toro",
          "Alerta de consanguinidad al servir",
        ],
      },
      {
        titulo: "Alertas",
        href: "/reproduccion/alertas",
        icono: "alerta",
        permisos: ["reproduccion:leer"],
        descripcion: "Partos próximos, vacas por secar, por diagnosticar y repetidoras.",
        alcance: [
          "Partos próximos",
          "Vacas por secar",
          "Vacas servidas pendientes de diagnóstico",
          "Vacas vacías con muchos días abiertos",
          "Repetidoras",
        ],
      },
    ],
  },
  {
    titulo: "Producción",
    icono: "produccion",
    paginas: [
      {
        titulo: "Ordeños",
        href: "/produccion/ordenos",
        icono: "ordeno",
        permisos: ["produccion:leer"],
        descripcion: "Litros por vaca o por lote en cada jornada.",
        alcance: ["Registro por vaca o por lote", "Jornada mañana, tarde o día completo"],
        registroRapido: true,
      },
      {
        titulo: "Lactancias",
        href: "/produccion/lactancias",
        icono: "lactancia",
        permisos: ["produccion:leer"],
        descripcion: "Curva de lactancia y producción ajustada a 305 días.",
        alcance: ["Días en leche", "Producción total y ajustada a 305 días"],
      },
      {
        titulo: "Entregas de leche",
        href: "/produccion/entregas",
        icono: "entrega",
        permisos: ["produccion:leer"],
        descripcion: "Litros entregados al comprador.",
        alcance: ["Litros por fecha y comprador", "Conciliación producidos vs. entregados"],
      },
      {
        titulo: "Consumo interno",
        href: "/produccion/consumo-interno",
        icono: "consumo",
        permisos: ["produccion:leer"],
        descripcion: "Leche para trabajadores, terneras, retiro y arriendo.",
        alcance: ["Litros por destino", "Valor de la leche entregada como arriendo"],
      },
      {
        titulo: "Pesajes",
        href: "/produccion/pesajes",
        icono: "pesaje",
        permisos: ["produccion:leer"],
        descripcion: "Pesajes con báscula o cinta.",
        alcance: ["Registro rápido de pesaje", "Pesaje por lote"],
        registroRapido: true,
      },
      {
        titulo: "Ganancia de peso",
        href: "/produccion/ganancia-peso",
        icono: "ganancia",
        permisos: ["produccion:leer"],
        descripcion: "Ganancia diaria de peso por animal y por lote.",
        alcance: ["GDP en g/día entre pesajes", "Comparativo por lote"],
      },
      {
        titulo: "Potreros y rotación",
        href: "/produccion/rotacion",
        icono: "potrero",
        permisos: ["produccion:leer"],
        descripcion: "Ocupación de potreros, días de descanso y carga animal.",
        alcance: [
          "Entrada y salida de lotes",
          "Días de ocupación y descanso",
          "Carga animal (UA/ha)",
        ],
      },
      {
        titulo: "Alimentación",
        href: "/produccion/alimentacion",
        icono: "alimentacion",
        permisos: ["produccion:leer"],
        descripcion: "Suministro de alimento por lote, enlazado a su costo.",
        alcance: ["Insumo, cantidad y lote", "Enlace con la compra (Módulo de costos)"],
      },
      {
        titulo: "Sanidad",
        href: "/produccion/sanidad",
        icono: "sanidad",
        permisos: ["sanidad:leer"],
        descripcion: "Vacunas, desparasitaciones y tratamientos con retiros.",
        alcance: [
          "Evento por animal o por lote",
          "Producto, dosis y veterinario",
          "Retiro de leche y de carne con alerta",
        ],
      },
    ],
  },
  {
    titulo: "Reportes",
    icono: "reportes",
    paginas: [
      {
        titulo: "Informe del productor",
        href: "/reportes/informe-productor",
        icono: "informe",
        permisos: ["reportes:costos"],
        descripcion: "Informe mensual de costos estilo Colanta.",
        alcance: [
          "Rubros con total, $/L y % de participación",
          "Litros producidos y vendidos, precio de venta, ingresos, gastos, utilidad y rentabilidad",
          "Costo / litros producidos y costo / litros vendidos",
          "Composición del hato real vs. ideal",
          "Exportación a PDF y Excel",
        ],
      },
      {
        titulo: "Reporte de costos",
        href: "/reportes/costos",
        icono: "costos",
        permisos: ["reportes:costos"],
        descripcion: "Costos por período, rubro, centro de costo, lote y animal.",
        alcance: ["Filtros por período, rubro y centro de costo", "Exportación a PDF y Excel"],
      },
      {
        titulo: "Reportes reproductivos",
        href: "/reportes/reproductivos",
        icono: "reproduccion",
        permisos: ["reportes:reproductivos"],
        descripcion: "IEP, días abiertos, servicios por concepción y tasa de preñez.",
        alcance: [
          "Intervalo entre partos y días abiertos",
          "Servicios por concepción y tasa de preñez",
          "Edad al primer parto",
          "Exportación a PDF y Excel",
        ],
      },
      {
        titulo: "Reportes productivos",
        href: "/reportes/productivos",
        icono: "produccion",
        permisos: ["reportes:productivos"],
        descripcion: "Producción de leche, ganancia de peso y carga animal.",
        alcance: [
          "Litros por vaca/día y por hectárea",
          "Ganancia diaria de peso por lote",
          "Carga animal",
          "Exportación a PDF y Excel",
        ],
      },
      {
        titulo: "Inventario",
        href: "/reportes/inventario",
        icono: "inventario",
        permisos: ["reportes:inventario"],
        descripcion: "Inventario por categoría, lote y potrero, y su rotación mensual.",
        alcance: [
          "Composición del hato real vs. ideal",
          "Inventario del mes anterior y rotación (entradas y salidas)",
          "Exportación a PDF y Excel",
        ],
      },
    ],
  },
  {
    titulo: "Configuración",
    icono: "configuracion",
    paginas: [
      {
        titulo: "Finca",
        href: "/configuracion/finca",
        icono: "finca",
        permisos: ["configuracion:gestionar"],
        descripcion: "Datos de la finca, reglas de categoría y % ideal del hato.",
        estado: "lista",
      },
      {
        titulo: "Usuarios",
        href: "/configuracion/usuarios",
        icono: "usuarios",
        permisos: ["usuario:gestionar"],
        descripcion: "Usuarios, roles y contraseñas.",
        estado: "lista",
      },
      {
        titulo: "Potreros",
        href: "/configuracion/potreros",
        icono: "potrero",
        permisos: ["configuracion:gestionar"],
        descripcion: "Potreros de la finca.",
        estado: "lista",
      },
      {
        titulo: "Lotes",
        href: "/configuracion/lotes",
        icono: "lote",
        permisos: ["configuracion:gestionar"],
        descripcion: "Lotes o grupos de manejo.",
        estado: "lista",
      },
      {
        titulo: "Razas",
        href: "/configuracion/razas",
        icono: "raza",
        permisos: ["configuracion:gestionar"],
        descripcion: "Catálogo de razas.",
        estado: "lista",
      },
      {
        titulo: "Toros",
        href: "/configuracion/toros",
        icono: "toro",
        permisos: ["configuracion:gestionar", "reproduccion:gestionar"],
        descripcion: "Toros propios y externos (pajillas).",
        estado: "lista",
      },
      {
        titulo: "Centros de costo",
        href: "/configuracion/centros-costo",
        icono: "centro",
        permisos: ["configuracion:gestionar"],
        descripcion: "Lechería, cría, ceba, pasturas, administración…",
        estado: "lista",
      },
      {
        titulo: "Rubros de costo",
        href: "/configuracion/rubros",
        icono: "informe",
        permisos: ["configuracion:gestionar"],
        descripcion: "Rubros del informe de costos (fijos, variables y empresariales).",
        estado: "lista",
      },
      {
        titulo: "Categorías de gasto",
        href: "/configuracion/categorias-gasto",
        icono: "categoria",
        permisos: ["configuracion:gestionar"],
        descripcion: "Categorías de gasto y su rubro.",
        estado: "lista",
      },
      {
        titulo: "Insumos",
        href: "/configuracion/insumos",
        icono: "insumo",
        permisos: ["configuracion:gestionar"],
        descripcion: "Alimentos, sales, medicamentos, semen, fertilizantes…",
        estado: "lista",
      },
      {
        titulo: "Proveedores",
        href: "/configuracion/proveedores",
        icono: "proveedor",
        permisos: ["configuracion:gestionar"],
        descripcion: "Proveedores de insumos y servicios.",
        estado: "lista",
      },
      {
        titulo: "Compradores",
        href: "/configuracion/compradores",
        icono: "comprador",
        permisos: ["configuracion:gestionar"],
        descripcion: "Compradores de leche y de ganado.",
        estado: "lista",
      },
      {
        titulo: "Trabajadores",
        href: "/configuracion/trabajadores",
        icono: "trabajador",
        permisos: ["configuracion:gestionar"],
        descripcion: "Trabajadores fijos y eventuales.",
        estado: "lista",
      },
      {
        titulo: "Auditoría",
        href: "/auditoria",
        icono: "auditoria",
        permisos: ["auditoria:leer"],
        descripcion: "Quién cambió qué y cuándo.",
        estado: "lista",
      },
    ],
  },
];

export const TODAS_LAS_PAGINAS: PaginaNav[] = NAVEGACION.flatMap((s) => s.paginas);

export function paginaPorHref(href: string): PaginaNav {
  const p = TODAS_LAS_PAGINAS.find((x) => x.href === href);
  if (!p) throw new Error(`Página no registrada en la navegación: ${href}`);
  return p;
}

/** Navegación visible para un rol (secciones sin páginas permitidas se omiten). */
export function navegacionPara(rol: Rol): SeccionNav[] {
  return NAVEGACION.map((s) => ({
    ...s,
    paginas: s.paginas.filter((p) => puedeAlguno(rol, p.permisos)),
  })).filter((s) => s.paginas.length > 0);
}
