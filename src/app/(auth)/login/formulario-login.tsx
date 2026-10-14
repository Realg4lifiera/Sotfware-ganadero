"use client";

import { useActionState } from "react";
import { AlertCircle, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iniciarSesion } from "./acciones";

export function FormularioLogin({ desde }: { desde?: string }) {
  const [estado, enviar, pendiente] = useActionState(iniciarSesion, {});

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <input type="hidden" name="desde" value={desde ?? ""} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="usuario">Usuario</Label>
        <Input
          id="usuario"
          name="usuario"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="clave">Contraseña</Label>
        <Input id="clave" name="clave" type="password" autoComplete="current-password" required />
      </div>
      {estado.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{estado.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={pendiente}>
        <LogIn />
        {pendiente ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
