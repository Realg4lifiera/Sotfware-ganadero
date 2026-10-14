import type { Metadata } from "next";
import { ETIQUETA_ROL } from "@/lib/permisos";
import { requiereSesion } from "@/lib/sesion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EncabezadoPagina } from "@/components/layout/encabezado-pagina";
import { FormularioClave } from "./formulario-clave";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function PaginaCuenta() {
  const usuario = await requiereSesion();
  return (
    <>
      <EncabezadoPagina
        titulo="Mi cuenta"
        descripcion={`${usuario.nombre} · ${usuario.usuario} · ${ETIQUETA_ROL[usuario.rol]}`}
      />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>Usa al menos 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioClave />
        </CardContent>
      </Card>
    </>
  );
}
