"use client";

import { TriangleAlert } from "lucide-react";
import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import {
  CAMPOS_ABORTO,
  CAMPOS_CELO,
  CAMPOS_DESCARTE,
  CAMPOS_DIAGNOSTICO,
  CAMPOS_PARTO,
  CAMPOS_SECADO,
  CAMPOS_SERVICIO,
  esquemaAborto,
  esquemaCelo,
  esquemaDescarte,
  esquemaDiagnostico,
  esquemaParto,
  esquemaSecado,
  esquemaServicio,
  ocultarCampoDiagnostico,
  ocultarCampoParto,
  ocultarCampoServicio,
} from "@/lib/validaciones/reproduccion";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import {
  registrarAborto,
  registrarCelo,
  registrarDescarte,
  registrarDiagnostico,
  registrarParto,
  registrarSecado,
  registrarServicio,
} from "./acciones";

interface Props {
  valores: ValoresFormulario;
  opcionesDinamicas: Record<string, Opcion[]>;
}

export function FormularioCelo({ valores, opcionesDinamicas }: Props) {
  return (
    <FormularioSecciones
      secciones={[{ titulo: "Celo", campos: CAMPOS_CELO }]}
      esquema={esquemaCelo}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={registrarCelo}
      destino={() => "/reproduccion/celos"}
      textoBoton="Registrar celo"
      mensajeExito="Celo registrado."
    />
  );
}

export function FormularioServicio({
  valores,
  opcionesDinamicas,
  alertas,
  toroDePajilla,
}: Props & { alertas: Record<string, string[]>; toroDePajilla: Record<string, string> }) {
  return (
    <FormularioSecciones
      secciones={[{ titulo: "Servicio", campos: CAMPOS_SERVICIO }]}
      esquema={esquemaServicio}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={registrarServicio}
      destino={() => "/reproduccion/servicios"}
      textoBoton="Registrar servicio"
      mensajeExito="Servicio registrado."
      ocultar={ocultarCampoServicio}
      resumen={(v) => {
        const toro =
          v.tipo === "INSEMINACION" ? toroDePajilla[String(v.pajillaId)] : String(v.toroId ?? "");
        const avisos = alertas[`${v.hembraId}|${toro}`];
        return avisos ? (
          <div role="alert" className="text-warning flex gap-2 text-sm font-medium">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Posible consanguinidad: {avisos.join(" ")} Puedes registrarlo si el veterinario lo
              aprueba.
            </span>
          </div>
        ) : null;
      }}
    />
  );
}

export function FormularioDiagnostico({ valores, opcionesDinamicas }: Props) {
  return (
    <FormularioSecciones
      secciones={[{ titulo: "Diagnóstico de preñez", campos: CAMPOS_DIAGNOSTICO }]}
      esquema={esquemaDiagnostico}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={registrarDiagnostico}
      destino={() => "/reproduccion/diagnosticos"}
      textoBoton="Registrar diagnóstico"
      mensajeExito="Diagnóstico registrado."
      ocultar={ocultarCampoDiagnostico}
    />
  );
}

export function FormularioParto({
  valores,
  opcionesDinamicas,
  padres,
}: Props & { padres: Record<string, string> }) {
  const crias = CAMPOS_PARTO.filter((c) => c.nombre.startsWith("cria"));
  return (
    <FormularioSecciones
      secciones={[
        {
          titulo: "Parto",
          campos: CAMPOS_PARTO.filter(
            (c) => !c.nombre.startsWith("cria") && c.nombre !== "observaciones",
          ),
        },
        {
          titulo: "Crías",
          descripcion: "Cada cría queda registrada como animal, con su madre y su padre.",
          campos: [...crias, ...CAMPOS_PARTO.filter((c) => c.nombre === "observaciones")],
        },
      ]}
      esquema={esquemaParto}
      valores={valores}
      opcionesDinamicas={opcionesDinamicas}
      enviar={registrarParto}
      destino={() => "/reproduccion/partos"}
      textoBoton="Registrar parto"
      mensajeExito="Parto registrado."
      ocultar={ocultarCampoParto}
      alCambiar={(campo, v, fijar) => {
        if (campo === "hembraId") fijar("toroId", padres[String(v.hembraId)] ?? "");
      }}
    />
  );
}

function formularioSimple(
  titulo: string,
  campos: typeof CAMPOS_SECADO,
  esquema: typeof esquemaSecado,
  enviar: typeof registrarSecado,
  ruta: string,
  boton: string,
) {
  return function Formulario({ valores, opcionesDinamicas }: Props) {
    return (
      <FormularioSecciones
        secciones={[{ titulo, campos }]}
        esquema={esquema}
        valores={valores}
        opcionesDinamicas={opcionesDinamicas}
        enviar={enviar}
        destino={() => ruta}
        textoBoton={boton}
        mensajeExito={`${titulo} registrado.`}
      />
    );
  };
}

export const FormularioAborto = formularioSimple(
  "Aborto",
  CAMPOS_ABORTO,
  esquemaAborto,
  registrarAborto,
  "/reproduccion/abortos",
  "Registrar aborto",
);
export const FormularioSecado = formularioSimple(
  "Secado",
  CAMPOS_SECADO,
  esquemaSecado,
  registrarSecado,
  "/reproduccion/secados",
  "Registrar secado",
);
export const FormularioDescarte = formularioSimple(
  "Descarte",
  CAMPOS_DESCARTE,
  esquemaDescarte,
  registrarDescarte,
  "/reproduccion/descartes",
  "Registrar descarte",
);
