import { z } from "zod";

export const ROLES = ["ADMIN", "MAYORDOMO", "VETERINARIO", "CONTADOR", "PROPIETARIO"] as const;

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
  /** Fincas a las que entra (el administrador entra a todas y se ignora). */
  fincaIds: z.array(z.number().int().positive()).max(500).default([]),
});

/** Todo rol distinto de administrador necesita al menos una finca. */
const exigirFinca = (d: { rol: string; fincaIds: number[] }, ctx: z.RefinementCtx) => {
  if (d.rol !== "ADMIN" && d.fincaIds.length === 0)
    ctx.addIssue({ code: "custom", path: ["fincaIds"], message: "Elige al menos una finca." });
};

export const crearUsuarioSchema = usuarioBaseSchema
  .extend({
    usuario: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9._-]{3,30}$/,
        "Entre 3 y 30 caracteres: letras sin tildes, números, punto, guion.",
      ),
    clave,
  })
  .superRefine(exigirFinca);
export type CrearUsuario = z.input<typeof crearUsuarioSchema>;

export const editarUsuarioSchema = usuarioBaseSchema.superRefine(exigirFinca);
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
