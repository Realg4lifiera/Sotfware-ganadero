import { z } from "zod";

export const ROLES = ["ADMIN", "MAYORDOMO", "VETERINARIO", "CONTADOR"] as const;

const clave = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña es demasiado larga.");

const email = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.toLowerCase() : null))
  .refine((v) => v === null || z.email().safeParse(v).success, "Correo electrónico no válido.");

export const usuarioBaseSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre.").max(100),
  email,
  rol: z.enum(ROLES, { message: "Selecciona un rol." }),
});

export const crearUsuarioSchema = usuarioBaseSchema.extend({
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9._-]{3,30}$/,
      "Entre 3 y 30 caracteres: letras sin tildes, números, punto, guion.",
    ),
  clave,
});
export type CrearUsuario = z.input<typeof crearUsuarioSchema>;

export const editarUsuarioSchema = usuarioBaseSchema;
export type EditarUsuario = z.input<typeof editarUsuarioSchema>;

export const restablecerClaveSchema = z.object({ clave });

export const cambiarMiClaveSchema = z
  .object({
    actual: z.string().min(1, "Escribe tu contraseña actual."),
    nueva: clave,
    confirmar: z.string(),
  })
  .refine((d) => d.nueva === d.confirmar, {
    path: ["confirmar"],
    message: "Las contraseñas no coinciden.",
  })
  .refine((d) => d.nueva !== d.actual, {
    path: ["nueva"],
    message: "Debe ser distinta de la actual.",
  });
export type CambiarMiClave = z.input<typeof cambiarMiClaveSchema>;
