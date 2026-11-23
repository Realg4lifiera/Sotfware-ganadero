# Campo Verde · Software ganadero

Software lechero/ganadero en Colombia para administrar **varias fincas** con los mismos
parámetros: al entrar se ve el resumen de todas ("Mis fincas") y, al elegir una, su manejo
completo. Cada finca tiene registro único de animales y cuatro módulos: costos de
producción, gestión reproductiva, gestión productiva y reportes (pantalla, Excel y PDF).
El contexto completo para desarrollar está en [`CLAUDE.md`](CLAUDE.md).

## Requisitos

- Node.js 22 o superior
- PostgreSQL 16 o superior (local con Docker, o [Supabase](https://supabase.com) en la nube)

## Instalación local

```bash
git clone <url-del-repositorio> software-ganadero
cd software-ganadero
npm install                 # instala dependencias y genera el cliente de Prisma

cp .env.example .env        # revisa los valores; en local sirven tal cual
docker compose up -d        # PostgreSQL en localhost:5432 (usuario/clave: ganadero)

npm run db:deploy           # aplica las migraciones
npm run db:seed             # datos de prueba (2 fincas, un usuario por rol)
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
| `propietario` | Propietario   | Consulta todo de su finca (Campo Verde) y exporta; no registra nada                                      |

El administrador entra a las dos fincas de prueba; los demás usuarios solo a Campo Verde.

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
| `npm run prod:estado`         | Ver las migraciones pendientes en Supabase (lee `.env.produccion`)                   |
| `npm run prod:migrar`         | Aplicar las migraciones en Supabase                                                  |
| `npm run prod:inicial`        | Carga inicial en Supabase (pregunta la finca y la contraseña del administrador)      |

## Despliegue en Vercel

1. **Base de datos (Supabase).** Proyecto `software-ganadero` en `us-east-1` (plan Free),
   con la **Data API desactivada** y RLS en todas las tablas: la app entra directo a
   PostgreSQL, nadie más. En _Connect › Connection string › URI_ están las dos cadenas:
   - `DATABASE_URL`: «Transaction pooler» (puerto 6543), la usa la app.
   - `DATABASE_URL_UNPOOLED`: «Session pooler» (puerto 5432), la usan las migraciones.

   Van en `.env.produccion` (para los comandos `prod:*` desde tu computador). En Vercel
   no se copian: el almacén `supabase-software-ganadero` está conectado al proyecto
   (_Storage_, prefijo `POSTGRES`) y crea `POSTGRES_PRISMA_URL` y
   `POSTGRES_URL_NON_POOLING`, que la app usa si faltan las anteriores. La app cifra la
   conexión sola (`lib/conexion-bd.ts`). El plan Free pausa el proyecto tras una semana
   sin uso.

2. **Archivos (Vercel Blob).** _Storage › Blob › Create_ con acceso **privado** y conéctalo al
   proyecto (crea `BLOB_READ_WRITE_TOKEN`). Las fotos y soportes solo se sirven a usuarios
   con sesión, a través de `/api/archivos/…`.
3. **Variables de entorno** (Settings › Environment Variables):
   - `AUTH_SECRET`: genera una con `openssl rand -base64 32`.
   - `ALMACENAMIENTO=vercel-blob`
4. **Build.** En _Settings › Build and Deployment_ usa como comando de build
   `npm run db:deploy && npm run build` para aplicar migraciones en cada despliegue.
5. **Carga inicial** (una sola vez, desde tu computador con `.env.produccion`):

   ```bash
   npm run prod:inicial
   ```

   Crea la primera finca, el administrador (deberá cambiar la contraseña al entrar) y los
   catálogos base. Las demás fincas se crean desde la app (_Mis fincas › Gestionar
   fincas_) y el acceso de cada usuario se asigna en _Configuración › Usuarios_. **No uses `db:seed` en producción**: son datos de prueba.

La zona horaria de la aplicación es `America/Bogota` y no depende de la del servidor.

## Datos del cliente

Todo el inventario se puede exportar a Excel desde _Animales › Exportar Excel_ (todos los
estados más la composición del hato). La carga masiva se hace desde _Animales › Importar_
con la plantilla descargable, que trae listas desplegables con los catálogos de la finca.

## Estructura

```
prisma/          schema.prisma · migrations/ · seed.ts · inicial.ts · catalogos-base.ts
src/proxy.ts     exige sesión en toda la app
src/app/         (auth)/login · (inicio)/fincas · (app)/… páginas por módulo · api/ (archivos, Excel, auth)
src/lib/         permisos, accion, auditoria, almacenamiento/, dominio/, servicios/,
                 validaciones/, excel/, indicadores/, formato, fechas
src/components/  ui/ (estilo shadcn) · layout/ · tabla-datos/ · formularios/
tests/           Vitest (unitarias e integración con BD)
```
