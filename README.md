# Campo Verde · Software ganadero

Software para una finca lechera/ganadera en Colombia: registro único de animales y cuatro
módulos (costos de producción, gestión reproductiva, gestión productiva y reportes).

Esta versión es la **base**: proyecto, modelo de datos completo, autenticación por roles,
auditoría, configuración y catálogos, registro de animales (con hoja de vida, movimientos e
importación/exportación en Excel), máquina de estados reproductiva y el esqueleto navegable
de los cuatro módulos. El contexto completo para desarrollar está en [`CLAUDE.md`](CLAUDE.md).

## Requisitos

- Node.js 22 o superior
- PostgreSQL 16 (local con Docker, o [Neon](https://neon.tech) en la nube)

## Instalación local

```bash
git clone <url-del-repositorio> software-ganadero
cd software-ganadero
npm install                 # instala dependencias y genera el cliente de Prisma

cp .env.example .env        # revisa los valores; en local sirven tal cual
docker compose up -d        # PostgreSQL en localhost:5432 (usuario/clave: ganadero)

npm run db:deploy           # aplica las migraciones
npm run db:seed             # datos de prueba (finca, 45 animales, un usuario por rol)
npm run dev                 # http://localhost:3000
```

Si ya tienes PostgreSQL instalado, crea la base y el usuario y ajusta `DATABASE_URL` en
`.env` en lugar de usar Docker.

### Usuarios de prueba

Todos con la contraseña `ganadero123`:

| Usuario       | Rol           | Qué puede hacer                                                                                          |
| ------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `admin`       | Administrador | Todo: configuración, usuarios, todos los módulos y reportes                                              |
| `mayordomo`   | Mayordomo     | Eventos de campo (reproducción, ordeños, pesajes, leche, gastos), traslados; consulta animales y sanidad |
| `veterinario` | Veterinario   | Reproducción, sanidad, toros y pajillas, hojas de vida, costos de sanidad, reportes reproductivos        |
| `contador`    | Contador      | Costos y reportes en solo lectura; consulta y exporta animales                                           |

## Comandos

| Comando                       | Para qué                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`                 | Servidor de desarrollo                                                               |
| `npm run build` / `npm start` | Compilar y correr en modo producción                                                 |
| `npm run check`               | Lint + typecheck + pruebas (correr antes de cada commit)                             |
| `npm run test:bd`             | Pruebas, incluidas las de integración contra la BD local                             |
| `npm run format`              | Formatear con Prettier                                                               |
| `npm run db:migrate`          | Crear una migración nueva al cambiar `prisma/schema.prisma`                          |
| `npm run db:deploy`           | Aplicar migraciones pendientes                                                       |
| `npm run db:seed`             | Cargar datos de prueba (BD vacía)                                                    |
| `npm run db:reset`            | Borrar la BD local, migrar y sembrar de nuevo                                        |
| `npm run db:inicial`          | Carga inicial de producción (finca + administrador + catálogos, sin datos de prueba) |

## Despliegue en Vercel

1. **Base de datos (Neon).** En el proyecto de Vercel, _Storage › Marketplace › Neon_.
   La integración crea `DATABASE_URL` (con pool, la usa la app) y `DATABASE_URL_UNPOOLED`
   (directa, la usan las migraciones).
2. **Archivos (Vercel Blob).** _Storage › Blob › Create_ con acceso **privado** y conéctalo al
   proyecto (crea `BLOB_READ_WRITE_TOKEN`). Las fotos y soportes solo se sirven a usuarios
   con sesión, a través de `/api/archivos/…`.
3. **Variables de entorno** (Settings › Environment Variables):
   - `AUTH_SECRET`: genera una con `openssl rand -base64 32`.
   - `ALMACENAMIENTO=vercel-blob`
4. **Build.** En _Settings › Build and Deployment_ usa como comando de build
   `npm run db:deploy && npm run build` para aplicar migraciones en cada despliegue.
5. **Carga inicial** (una sola vez, desde tu computador con las variables de Neon):

   ```bash
   DATABASE_URL="<url de Neon>" FINCA_NOMBRE="Nombre de la finca" \
   ADMIN_USUARIO="admin" ADMIN_CLAVE="una-clave-segura" npm run db:inicial
   ```

   Crea la finca, el administrador (deberá cambiar la contraseña al entrar) y los catálogos
   base. **No uses `db:seed` en producción**: son datos de prueba.

La zona horaria de la aplicación es `America/Bogota` y no depende de la del servidor.

## Datos del cliente

Todo el inventario se puede exportar a Excel desde _Animales › Exportar Excel_ (todos los
estados más la composición del hato). La carga masiva se hace desde _Animales › Importar_
con la plantilla descargable, que trae listas desplegables con los catálogos de la finca.

## Estructura

```
prisma/          schema.prisma · migrations/ · seed.ts · inicial.ts · catalogos-base.ts
src/proxy.ts     exige sesión en toda la app
src/app/         (auth)/login · (app)/… páginas por módulo · api/ (archivos, Excel, auth)
src/lib/         permisos, accion, auditoria, almacenamiento/, dominio/, servicios/,
                 validaciones/, excel/, indicadores/, formato, fechas
src/components/  ui/ (estilo shadcn) · layout/ · tabla-datos/ · formularios/
tests/           Vitest (unitarias e integración con BD)
```
