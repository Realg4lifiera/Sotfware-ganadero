"use client";

import type { Opcion, ValoresFormulario } from "@/lib/formularios/campos";
import {
  CAMPOS_CELO,
  CAMPOS_DIAGNOSTICO,
  CAMPOS_SERVICIO,
  esquemaCelo,
  esquemaDiagnostico,
  esquemaServicio,
  ocultarCampoDiagnostico,
  ocultarCampoServicio,
} from "@/lib/validaciones/reproduccion";
import { FormularioSecciones } from "@/components/formularios/formulario-secciones";
import { registrarCelo, registrarDiagnostico, registrarServicio } from "./acciones";

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

export function FormularioServicio({ valores, opcionesDinamicas }: Props) {
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
