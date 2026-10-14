/**
 * Máquina de estados reproductiva de las hembras bovinas (tabla aprobada en CLAUDE.md).
 *
 * El estado reproductivo NUNCA se edita a mano: el servicio del Módulo 2 llama a
 * `aplicarEvento` y guarda el resultado (estado, partos y efectos sobre la lactancia).
 * "En producción" no es un estado: se deriva de tener una lactancia abierta.
 *
 * | Evento               | Desde                                   | Hacia                              |
 * |----------------------|-----------------------------------------|------------------------------------|
 * | Servicio             | NOVILLA, VACIA, PARIDA, SERVIDA         | SERVIDA                            |
 * | Diagnóstico positivo | SERVIDA (y NOVILLA/VACIA/PARIDA*)       | PRENADA                            |
 * | Diagnóstico negativo | SERVIDA, PRENADA                        | VACIA (NOVILLA si nunca ha parido) |
 * | Parto                | PRENADA, SECA                           | PARIDA (abre lactancia)            |
 * | Aborto               | PRENADA, SECA                           | VACIA (NOVILLA si nunca ha parido) |
 * | Secado               | PRENADA con lactancia abierta           | SECA (cierra lactancia)            |
 * | Secado (no preñada)  | PARIDA, VACIA, SERVIDA con lactancia    | cierra lactancia; PARIDA → VACIA   |
 * | Celo, descarte       | cualquiera                              | sin cambio                         |
 *
 * (*) Preñez por monta no registrada. Además se aceptan como "sin cambio" las
 * reconfirmaciones: diagnóstico positivo en PRENADA/SECA y negativo en NOVILLA/VACIA/PARIDA.
 * Cualquier otra combinación es un error de negocio con mensaje en español.
 */
import type { EstadoReproductivo } from "@/generated/prisma/enums";
import { ETIQUETA_ESTADO_REPRODUCTIVO } from "@/lib/etiquetas";

export type EventoReproductivo =
  | { tipo: "CELO" }
  | { tipo: "SERVICIO" }
  | { tipo: "DIAGNOSTICO"; resultado: "PRENADA" | "VACIA" }
  | { tipo: "PARTO" }
  | { tipo: "ABORTO" }
  | { tipo: "SECADO" }
  | { tipo: "DESCARTE" };

export type TipoEventoReproductivo = EventoReproductivo["tipo"];

export interface SituacionHembra {
  estado: EstadoReproductivo;
  /** Partos totales (incluye los previos a su registro). */
  numeroPartos: number;
  lactanciaAbierta: boolean;
}

export interface ResultadoTransicion {
  estado: EstadoReproductivo;
  numeroPartos: number;
  /** Abrir una lactancia nueva (parto). */
  abrirLactancia: boolean;
  /** Cerrar la lactancia abierta (secado, o parto sin secado previo). */
  cerrarLactancia: boolean;
  /** Verdadero si el evento no cambia nada (p. ej. celo o reconfirmación). */
  sinCambio: boolean;
}

export class ErrorTransicion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorTransicion";
  }
}

const etiqueta = (e: EstadoReproductivo) => ETIQUETA_ESTADO_REPRODUCTIVO[e].toLowerCase();

/** VACIA, o NOVILLA si la hembra nunca ha parido. */
const vaciaONovilla = (h: SituacionHembra): EstadoReproductivo =>
  h.numeroPartos > 0 ? "VACIA" : "NOVILLA";

/** Aplica un evento y devuelve la nueva situación; lanza ErrorTransicion si no procede. */
export function aplicarEvento(h: SituacionHembra, evento: EventoReproductivo): ResultadoTransicion {
  const igual: ResultadoTransicion = {
    estado: h.estado,
    numeroPartos: h.numeroPartos,
    abrirLactancia: false,
    cerrarLactancia: false,
    sinCambio: true,
  };
  const a = (
    estado: EstadoReproductivo,
    cambios: Partial<ResultadoTransicion> = {},
  ): ResultadoTransicion => ({
    ...igual,
    estado,
    sinCambio: false,
    ...cambios,
  });

  switch (evento.tipo) {
    case "CELO":
    case "DESCARTE":
      return igual;

    case "SERVICIO":
      if (["NOVILLA", "VACIA", "PARIDA", "SERVIDA"].includes(h.estado)) return a("SERVIDA");
      throw new ErrorTransicion(
        `La hembra está ${h.estado === "SECA" ? "seca y preñada" : "preñada"}: no se puede registrar un servicio.`,
      );

    case "DIAGNOSTICO":
      if (evento.resultado === "PRENADA") {
        if (["SERVIDA", "NOVILLA", "VACIA", "PARIDA"].includes(h.estado)) return a("PRENADA");
        return igual; // PRENADA o SECA: reconfirmación
      }
      if (h.estado === "SERVIDA" || h.estado === "PRENADA") return a(vaciaONovilla(h));
      if (h.estado === "SECA")
        throw new ErrorTransicion(
          "Una vaca seca está preñada: si perdió la preñez, registra un aborto.",
        );
      return igual; // NOVILLA, VACIA o PARIDA: confirma que no está preñada

    case "PARTO":
      if (h.estado === "PRENADA" || h.estado === "SECA") {
        return a("PARIDA", {
          numeroPartos: h.numeroPartos + 1,
          abrirLactancia: true,
          // Si parió sin haberse secado, la lactancia anterior se cierra.
          cerrarLactancia: h.lactanciaAbierta,
        });
      }
      throw new ErrorTransicion(
        `Solo una hembra preñada o seca puede parir (está ${etiqueta(h.estado)}).`,
      );

    case "ABORTO":
      if (h.estado === "PRENADA" || h.estado === "SECA") return a(vaciaONovilla(h));
      throw new ErrorTransicion(
        `Solo se registra un aborto en una hembra preñada o seca (está ${etiqueta(h.estado)}).`,
      );

    case "SECADO":
      if (!h.lactanciaAbierta)
        throw new ErrorTransicion("La vaca no está en producción: no tiene una lactancia abierta.");
      switch (h.estado) {
        case "PRENADA":
          return a("SECA", { cerrarLactancia: true });
        case "PARIDA":
          return a("VACIA", { cerrarLactancia: true });
        case "VACIA":
        case "SERVIDA":
          return a(h.estado, { cerrarLactancia: true });
        default:
          throw new ErrorTransicion(
            `No se puede secar una hembra ${etiqueta(h.estado)} con lactancia abierta; revisa su historial.`,
          );
      }
  }
}

/** Eventos que se pueden registrar ahora (para mostrar solo los botones válidos). */
export function eventosPermitidos(h: SituacionHembra): EventoReproductivo[] {
  const candidatos: EventoReproductivo[] = [
    { tipo: "CELO" },
    { tipo: "SERVICIO" },
    { tipo: "DIAGNOSTICO", resultado: "PRENADA" },
    { tipo: "DIAGNOSTICO", resultado: "VACIA" },
    { tipo: "PARTO" },
    { tipo: "ABORTO" },
    { tipo: "SECADO" },
    { tipo: "DESCARTE" },
  ];
  return candidatos.filter((e) => {
    try {
      aplicarEvento(h, e);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Reconstruye el estado aplicando eventos en orden (útil para auditar o recalcular un
 * historial). Lanza ErrorTransicion indicando el evento que no procede.
 */
export function reproducirHistorial(
  inicial: SituacionHembra,
  eventos: EventoReproductivo[],
): SituacionHembra {
  let h = { ...inicial };
  eventos.forEach((e, i) => {
    try {
      const r = aplicarEvento(h, e);
      const lactanciaAbierta = r.abrirLactancia
        ? true
        : r.cerrarLactancia
          ? false
          : h.lactanciaAbierta;
      h = { estado: r.estado, numeroPartos: r.numeroPartos, lactanciaAbierta };
    } catch (err) {
      throw new ErrorTransicion(
        `Evento ${i + 1} (${e.tipo.toLowerCase()}): ${(err as Error).message}`,
      );
    }
  });
  return h;
}
