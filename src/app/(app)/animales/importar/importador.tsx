"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { confirmarImportacion, previsualizarImportacion, type VistaPrevia } from "./acciones";

export function ImportadorAnimales() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<VistaPrevia | null>(null);
  const [soloErrores, setSoloErrores] = useState(false);
  const [resultado, setResultado] = useState<{ importados: number; omitidos: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validando, iniciarValidacion] = useTransition();
  const [importando, iniciarImportacion] = useTransition();

  const datos = () => {
    const f = new FormData();
    f.set("archivo", archivo!);
    return f;
  };

  const validar = () =>
    iniciarValidacion(async () => {
      setError(null);
      setVista(null);
      setResultado(null);
      const r = await previsualizarImportacion(datos());
      if (r.ok) {
        setVista(r.datos);
        setSoloErrores(r.datos.conError > 0);
      } else setError(r.error);
    });

  const importar = () =>
    iniciarImportacion(async () => {
      const r = await confirmarImportacion(datos());
      if (r.ok) {
        setResultado(r.datos);
        setVista(null);
        setArchivo(null);
        toast.success(`${r.datos.importados} animales importados.`);
      } else {
        setError(r.error);
        toast.error(r.error);
      }
    });

  const filas = vista
    ? soloErrores
      ? vista.filas.filter((f) => f.errores.length)
      : vista.filas
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Sube el archivo y revisa</CardTitle>
        <CardDescription>
          Primero se valida fila por fila; nada se guarda hasta que confirmes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-label="Archivo de Excel"
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null);
              setVista(null);
              setError(null);
            }}
          />
          <Button onClick={validar} disabled={!archivo || validando}>
            <Upload /> {validando ? "Validando…" : "Validar archivo"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resultado && (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>Importación completa</AlertTitle>
            <AlertDescription>
              <p>
                Se registraron {resultado.importados} animales
                {resultado.omitidos > 0 &&
                  ` y se omitieron ${resultado.omitidos} filas con errores`}
                .
              </p>
              <Link href="/animales" className="font-semibold underline">
                Ver inventario
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {vista && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                <CheckCircle2 /> {vista.validas} válidas
              </Badge>
              {vista.conError > 0 && (
                <Badge variant="destructive" className="text-sm">
                  <XCircle /> {vista.conError} con errores
                </Badge>
              )}
              {vista.conError > 0 && (
                <label className="ml-auto flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={soloErrores}
                    onChange={(e) => setSoloErrores(e.target.checked)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  Ver solo filas con error
                </label>
              )}
            </div>

            <div className="max-h-[28rem] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0">
                  <TableRow>
                    <TableHead className="w-14">Fila</TableHead>
                    <TableHead>Animal</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((f) => (
                    <TableRow
                      key={f.fila}
                      className={f.errores.length ? "bg-destructive/5" : undefined}
                    >
                      <TableCell className="align-top tabular-nums">{f.fila}</TableCell>
                      <TableCell className="align-top">
                        <span className="font-semibold">{f.numero || "—"}</span>
                        {f.nombre && <span className="text-muted-foreground"> · {f.nombre}</span>}
                      </TableCell>
                      <TableCell className="align-top">
                        {f.errores.length === 0 ? (
                          <span className="text-success flex items-center gap-1.5">
                            <CheckCircle2 className="size-4" /> Lista{" "}
                            {f.resumen && `· ${f.resumen}`}
                          </span>
                        ) : (
                          <ul className="text-destructive flex flex-col gap-1">
                            {f.errores.map((e) => (
                              <li key={e} className="flex gap-1.5">
                                <XCircle className="mt-0.5 size-4 shrink-0" /> {e}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {vista.validas > 0 ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  {vista.conError > 0
                    ? `Se importarán ${vista.validas} filas válidas; las ${vista.conError} con errores se omiten (corrígelas y súbelas después).`
                    : "Todas las filas están listas."}
                </p>
                <Button size="lg" onClick={importar} disabled={importando}>
                  {importando ? "Importando…" : `Importar ${vista.validas} animales`}
                </Button>
              </div>
            ) : (
              <p className="text-destructive text-sm font-medium">
                Ninguna fila es válida. Corrige el archivo y vuelve a validarlo.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
