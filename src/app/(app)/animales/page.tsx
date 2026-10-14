import type { Metadata } from "next";
import Link from "next/link";
import { FileDown, FileUp, Plus } from "lucide-react";
import { ETIQUETA_CATEGORIA } from "@/lib/dominio/categoria";
import {
  ETIQUETA_ESTADO_ANIMAL,
  ETIQUETA_ESTADO_REPRODUCTIVO,
  ETIQUETA_SEXO,
} from "@/lib/etiquetas";
import { edadTexto, hoy, mesesEntre } from "@/lib/fechas";
import { puede } from "@/lib/permisos";
import { requierePermiso } from "@/lib/sesion";
import { animalesConCategoria } from "@/lib/servicios/inventario";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { VistaAnimales, type FilaAnimal, type FiltrosAnimales } from "./vista-animales";

export const metadata: Metadata = { title: "Animales" };

export default async function PaginaAnimales({ searchParams }: PageProps<"/animales">) {
  const usuario = await requierePermiso("animal:leer");
  const sp = await searchParams;
  const texto = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const filtros: FiltrosAnimales = {
    q: texto("q"),
    lote: texto("lote"),
    potrero: texto("potrero"),
    sexo: texto("sexo"),
    categoria: texto("categoria"),
    estado: texto("estado") || "ACTIVO",
  };

  // Todos los animales no eliminados (el filtro de estado se aplica en la vista).
  const animales = await animalesConCategoria({});
  const ref = hoy();
  const filas: FilaAnimal[] = animales.map((a) => ({
    id: a.id,
    numero: a.numero,
    nombre: a.nombre ?? "",
    sexo: a.sexo,
    sexoEtiqueta: ETIQUETA_SEXO[a.sexo],
    categoria: a.categoria,
    categoriaEtiqueta: ETIQUETA_CATEGORIA[a.categoria],
    raza: a.raza?.nombre ?? "",
    edad: a.fechaNacimiento ? edadTexto(a.fechaNacimiento, ref) : "",
    edadMeses: a.fechaNacimiento ? mesesEntre(a.fechaNacimiento, ref) : -1,
    loteId: a.loteId ?? "",
    lote: a.lote?.nombre ?? "",
    potreroId: a.potreroId ?? "",
    potrero: a.potrero?.nombre ?? "",
    estado: a.estado,
    estadoEtiqueta: ETIQUETA_ESTADO_ANIMAL[a.estado],
    estadoReproductivo: a.estadoReproductivo
      ? ETIQUETA_ESTADO_REPRODUCTIVO[a.estadoReproductivo]
      : "",
    tieneFoto: !!a.fotoClave,
    fotoUrl: a.fotoClave ? `/api/archivos/${a.fotoClave}` : null,
  }));

  return (
    <>
      <EncabezadoPagina
        titulo="Animales"
        descripcion="Inventario del hato. Toca un animal para ver su hoja de vida."
        acciones={
          <>
            {puede(usuario.rol, "animal:exportar") && (
              <Button asChild variant="outline">
                <a href="/api/exportar/animales">
                  <FileDown /> Exportar Excel
                </a>
              </Button>
            )}
            {puede(usuario.rol, "animal:importar") && (
              <Button asChild variant="outline">
                <Link href="/animales/importar">
                  <FileUp /> Importar
                </Link>
              </Button>
            )}
            {puede(usuario.rol, "animal:crear") && (
              <Button asChild>
                <Link href="/animales/nuevo">
                  <Plus /> Nuevo animal
                </Link>
              </Button>
            )}
          </>
        }
      />
      <VistaAnimales filas={filas} filtrosIniciales={filtros} />
    </>
  );
}
