"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Exporta la página a PDF con el diálogo de impresión del navegador ("Guardar como PDF").
 * La hoja de impresión oculta menús, botones y filtros y agrega el membrete de la finca.
 */
export function BotonPDF() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer /> PDF
    </Button>
  );
}
