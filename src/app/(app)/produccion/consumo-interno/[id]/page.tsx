import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prismaBase } from "@/lib/db";
import { ETIQUETA_DESTINO_LECHE } from "@/lib/etiquetas";
import { formatoFecha } from "@/lib/fechas";
import { formatoLitros } from "@/lib/formato";
import { valoresDesdeRegistro } from "@/lib/formularios/campos";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { CAMPOS_CONSUMO } from "@/lib/validaciones/leche";
import { BotonEliminar } from "@/components/boton-eliminar";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioConsumo } from "../formularios";
import { eliminarConsumo } from "../acciones";

export const metadata: Metadata = { title: "Consumo interno" };

export default async function PaginaConsumo({
  params,
}: PageProps<"/produccion/consumo-interno/[id]">) {
  const usuario = await requierePermiso("produccion:leer");
  const { id } = await params;
  const c = await prismaBase.consumoInternoLeche.findFirst({ where: { id, deletedAt: null } });
  if (!c) notFound();
  const editable = puede(usuario.rol, "leche:registrar");
  return (
    <>
      <EncabezadoPagina
        titulo={`${ETIQUETA_DESTINO_LECHE[c.destino]}: ${formatoLitros(c.litros)}`}
        descripcion={formatoFecha(c.fecha)}
        volver={{ href: "/produccion/consumo-interno", texto: "Consumo interno" }}
        acciones={
          editable && (
            <BotonEliminar
              accion={eliminarConsumo.bind(null, c.id)}
              titulo="¿Eliminar este registro?"
              descripcion="Deja de contar en los litros producidos. Queda en la auditoría."
              destino="/produccion/consumo-interno"
            />
          )
        }
      />
      {editable && (
        <FormularioConsumo id={c.id} valores={valoresDesdeRegistro(CAMPOS_CONSUMO, c)} />
      )}
    </>
  );
}
