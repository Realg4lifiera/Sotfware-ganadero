import { CheckCircle2, Hammer } from "lucide-react";
import { paginaPorHref } from "@/lib/navegacion";
import { requiereSesion } from "@/lib/sesion";
import { puedeAlguno } from "@/lib/permisos";
import { forbidden } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { Icono } from "@/components/layout/iconos";

/** Página de una funcionalidad del alcance que se construirá en un módulo posterior. */
export async function PaginaProximamente({ href }: { href: string }) {
  const pagina = paginaPorHref(href);
  const usuario = await requiereSesion();
  if (!puedeAlguno(usuario.rol, pagina.permisos)) forbidden();

  return (
    <>
      <EncabezadoPagina
        titulo={
          <span className="flex items-center gap-3">
            <Icono nombre={pagina.icono} className="text-primary size-7" />
            {pagina.titulo}
          </span>
        }
        descripcion={pagina.descripcion}
        acciones={
          <Badge variant="accent" className="text-sm">
            <Hammer /> Próximamente
          </Badge>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Lo que tendrá esta sección</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {(pagina.alcance ?? []).map((a) => (
              <li key={a} className="flex gap-2 text-sm">
                <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-4 text-sm">
            Los datos que se registren aquí quedarán ligados a cada animal o lote y alimentarán los
            reportes sin volver a digitarse.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
