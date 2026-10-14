import type { Metadata } from "next";
import { FileSpreadsheet } from "lucide-react";
import { requierePermiso } from "@/lib/sesion";
import { MAX_FILAS_IMPORTACION } from "@/lib/excel/columnas-animales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { ImportadorAnimales } from "./importador";

export const metadata: Metadata = { title: "Importar animales" };

export default async function PaginaImportar() {
  await requierePermiso("animal:importar");
  return (
    <>
      <EncabezadoPagina
        titulo="Importar animales"
        descripcion="Carga masiva del inventario desde Excel."
        volver={{ href: "/animales", texto: "Animales" }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>1. Descarga la plantilla</CardTitle>
            <CardDescription>
              Trae listas desplegables con tus razas, lotes, potreros y toros, y una hoja de
              instrucciones. Hasta {MAX_FILAS_IMPORTACION.toLocaleString("es-CO")} animales por
              archivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="/api/plantilla/animales">
                <FileSpreadsheet /> Descargar plantilla
              </a>
            </Button>
          </CardContent>
        </Card>
        <ImportadorAnimales />
      </div>
    </>
  );
}
