import type { Metadata } from "next";
import { valoresVacios } from "@/lib/formularios/campos";
import { hoyISO } from "@/lib/fechas";
import { requierePermiso } from "@/lib/sesion";
import { opcionesGasto } from "@/lib/servicios/gastos";
import { obtenerConfiguracionFinca } from "@/lib/servicios/inventario";
import { CAMPOS_GASTO } from "@/lib/validaciones/gastos";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioGasto } from "../formulario-gasto";

export const metadata: Metadata = { title: "Nuevo gasto" };

export default async function NuevoGasto() {
  await requierePermiso("gasto:registrar");
  const [opciones, config] = await Promise.all([opcionesGasto(), obtenerConfiguracionFinca()]);
  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo gasto"
        descripcion="Compra de insumos o gasto directo. Los totales se calculan solos."
        volver={{ href: "/costos/gastos", texto: "Compras y gastos" }}
      />
      <FormularioGasto
        valores={{ ...valoresVacios(CAMPOS_GASTO), fecha: hoyISO() }}
        opcionesDinamicas={opciones}
        ivaEsCosto={config.costos.ivaEsCosto}
      />
    </>
  );
}
