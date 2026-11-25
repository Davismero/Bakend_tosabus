# TosaBus API (backend)

API REST de TosaBus: monolito modular con NestJS, TypeScript estricto y
PostgreSQL. La base del repositorio y el entorno son de **T-01 (RNF-13)**.
Esta rama añade el módulo `companies` de **T-03: modelo de compañías y
aislamiento de datos por compañía**, que cubre **RF-38, RF-39 y RF-40**.

T-04 (registro de usuarios) y T-05 (login JWT) aún no están implementados:
el guard decodifica y verifica un JWT existente, pero la emisión del token
llega en T-05.

## Requisitos

- Node.js 20 o superior (en Docker se usa `node:22-alpine`).
- npm 10 o superior.
- Docker con el plugin Compose (`docker compose`) para el entorno reproducible.
- PostgreSQL 16 (solo si se ejecuta la API fuera de Docker).

En PowerShell de Windows, si el alias `npm.ps1` está bloqueado, usa `npm.cmd`
y `npx.cmd` en lugar de `npm` y `npx`.

## Variables de entorno

Copia el archivo de ejemplo y ajusta los valores:

```bash
cp .env.example .env
```

| Variable | Ejemplo | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno de ejecución (`development`, `production`, `test`). |
| `PORT` | `3000` | Puerto HTTP de la API. |
| `DATABASE_URL` | `postgresql://tosabus:tosabus@localhost:5432/tosabus` | Cadena de conexión para ejecución local (fuera de Docker). |
| `POSTGRES_DB` | `tosabus` | Nombre de la base de datos del contenedor `db`. |
| `POSTGRES_USER` | `tosabus` | Usuario de PostgreSQL del contenedor `db`. |
| `POSTGRES_PASSWORD` | `tosabus` | Contraseña de ejemplo; reemplazar en entornos reales. |
| `POSTGRES_PORT` | `5432` | Puerto de PostgreSQL publicado en el host. |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Orígenes permitidos, separados por comas (`*` solo en desarrollo). |
| `JWT_SECRET` | valor largo de ejemplo | Secreto para firmar tokens; obligatorio y de al menos 16 caracteres. |

Las variables se validan al arrancar con Joi (`src/config/env.validation.ts`).
Si falta `JWT_SECRET` o un valor no es válido, el proceso se detiene con un
mensaje claro. Nunca guardes secretos reales ni datos de tarjeta en el
repositorio; `.env` está ignorado por Git y por la imagen Docker.

## Ejecución local

```bash
npm.cmd install
# Solo la base de datos, desde este directorio:
docker compose up -d db
npm.cmd run start:dev
```

Sin Docker, puedes iniciar PostgreSQL por tu cuenta y usar `DATABASE_URL` del
`.env`. La API no abre conexión a la base de datos en T-01: el endpoint de
salud es independiente de ella.

- API: `http://localhost:3000/api/v1`
- Salud: `GET http://localhost:3000/api/v1/health` → `{ "estado": "ok", "servicio": "tosabus-api" }`
- Swagger: `http://localhost:3000/docs`

## Ejecución con Docker

```bash
# Construye la imagen y levanta PostgreSQL + API
docker compose up -d --build

# Ver estado y registros
docker compose ps
docker compose logs -f api

# Detener sin borrar datos
docker compose down
```

El servicio `api` espera a que `db` esté saludable antes de iniciar. Los datos
de PostgreSQL se guardan en el volumen nombrado `tosabus_db_data`, que se
conserva al ejecutar `docker compose down`. Para borrarlos deliberadamente:
`docker compose down -v`.

Si usas `POSTGRES_PASSWORD` con caracteres especiales, codifícalos como URI en
`DATABASE_URL` (o evítalos en despliegues de ejemplo). La cadena dentro de
Docker se arma con el host `db`, no con `localhost`.

## Conexión a PostgreSQL

Con el contenedor en marcha:

```bash
docker compose exec db psql -U tosabus -d tosabus
```

Desde el host: `psql "postgresql://tosabus:tosabus@localhost:5432/tosabus"` con
los valores definidos en `.env`.

## Módulo companies (T-03)

Cubre **RF-38** (alta, administración y desactivación de compañías por el
superadministrador), **RF-39** (configuración propia de tarifas, políticas y
marca) y **RF-40** (aislamiento de datos entre compañías).

### Estructura

```
src/modules/companies/
├── domain/                    # Compañía + reglas puras (sin NestJS ni ORM)
│   ├── compania.entity.ts
│   ├── configuracion-compania.ts
│   └── company.repository.ts  # puerto del repositorio
├── application/               # casos de uso (sin frameworks)
│   ├── crear-compania.use-case.ts
│   ├── desactivar-compania.use-case.ts
│   ├── actualizar-configuracion.use-case.ts
│   ├── obtener-compania.use-case.ts
│   ├── contexto-seguridad.ts
│   └── *.spec.ts              # dobles de prueba en repositorio-memoria.ts
├── adapters/in/               # controlador REST, DTOs y Swagger
│   ├── companies.controller.ts
│   └── dto.ts
├── infrastructure/            # adaptadores de salida
│   ├── database.ts            # puerto Database + adaptador pg (Pool)
│   ├── postgres-company.repository.ts
│   ├── company-context.ts     # JWT -> companyId (CompanyGuard)
│   ├── super-admin.guard.ts
│   ├── tokens.ts              # tokens de inyección de los puertos
│   ├── migrate.ts             # npm run db:migrate
│   └── migrations/001_companias_rls.sql
└── companies.module.ts
```

### Tablas y Row Level Security

La migración `001_companias_rls.sql` crea:

| Tabla | Columnas relevantes | Propósito |
|---|---|---|
| `companias` | `id uuid`, `nombre`, `slug` único, `administrador_id`, `activa bool`, `configuracion jsonb`, `created_at` | Compañías y su configuración (RF-38, RF-39). |
| `ejemplo_tenant` | `id uuid`, `company_id uuid` (FK), `descripcion` | Tabla de ejemplo para demostrar RF-40. |

Ambas tablas tienen `ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY`. Las
políticas usan `current_setting('app.company_id', true)` y
`current_setting('app.es_superadmin', true)`:

- Sin contexto → el usuario de la API no ve ninguna fila.
- Token de la compañía A → ve y modifica solo sus filas.
- Token de superadministrador (`app.es_superadmin = 'true'`) → ve todas.

**Aplicar la migración:**

```bash
# DATABASE_URL se lee del entorno (o del .env si se carga antes)
$env:DATABASE_URL='postgresql://tosabus:tosabus@localhost:5432/tosabus'  # PowerShell
npm.cmd run db:migrate
```

Nota de entorno local: el rol `tosabus` debe tener `CREATE` en el esquema
`public`. En una instalación portable donde `public` pertenece a
`pg_database_owner`, un administrador puede otorgarlo con:
`GRANT CREATE ON SCHEMA public TO tosabus;` (no se hace desde el código).
Los superusuarios de PostgreSQL bypassan RLS: las verificaciones de
aislamiento se hacen con el rol `tosabus`, no con `postgres`.

### Contexto del JWT y aislamiento (RF-40)

`CompanyContext` lee la cabecera `Authorization: Bearer <token>`, verifica la
firma con `JWT_SECRET` y extrae `companyId` y `rol`. Ese `companyId` es la
única fuente para el filtro de base de datos: nunca se lee del body, query ni
params. `PgDatabase.conContexto` abre una transacción y aplica:

```sql
SELECT set_config('app.company_id', $2, true);   -- true = LOCAL a la transacción
SELECT set_config('app.es_superadmin', 'false', true);
```

Los casos de uso vuelven a comprobar `puedeAcceder(contexto, id)` antes de
consultar o modificar, de modo que un token de la compañía A que manipule la
URL para apuntar a la compañía B recibe `403 Forbidden` (RF-40). En paralelo,
RLS bloquea la fila aunque el filtro de aplicación se omitiera.

### Endpoints

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/companies` | superadministrador | Alta de compañía con su administrador (RF-38). |
| `PATCH` | `/api/v1/companies/:id/desactivar` | superadministrador | Desactivar compañía (RF-38). |
| `GET` | `/api/v1/companies/:id` | superadministrador o la propia compañía | Consultar compañía (RF-40). |
| `PATCH` | `/api/v1/companies/:id/configuracion` | administrador de esa compañía | Tarifas, políticas y marca (RF-39). |

Los DTOs se validan con `class-validator` (nested validation) y aparecen en
Swagger en `/docs` bajo la etiqueta `companies`.

### Datos de ejemplo

No se cargan datos de ejemplo en la migración: los usados para verificar RLS
son ficticios y se eliminaron después de la prueba. Los datos verosímiles
definitivos llegan en T-41. No hay datos de tarjeta ni credenciales reales.

## Calidad

```bash
npm.cmd run lint     # ESLint (TypeScript estricto, sin any)
npm.cmd run build    # Compilación a dist/
npm.cmd run test     # Jest: pruebas unitarias y e2e (sin internet ni BD)
npm.cmd run format   # Prettier
```

## Calidad

```bash
npm.cmd run lint     # ESLint (TypeScript estricto, sin any)
npm.cmd run build    # Compilación a dist/
npm.cmd run test     # Jest: pruebas unitarias y e2e (sin internet ni BD)
npm.cmd run format   # Prettier
```

## Estructura de carpetas

```
src/
├── main.ts                 # Arranque: prefijo api/v1, ValidationPipe, CORS, Swagger
├── app.module.ts           # Módulo raíz con ConfigModule global
├── app.controller.ts       # GET /api/v1/health
├── config/
│   ├── api.ts              # Prefijo global compartido
│   └── env.validation.ts   # Validación de variables de entorno
└── modules/
    ├── README.md           # Patrón de capas y módulos previstos
    └── companies/          # T-03: compañías + aislamiento (RF-38/39/40)
test/
├── setup-env.ts            # Variables ficticias solo para pruebas
└── app.e2e-spec.ts         # Prueba e2e del estado de salud
```

Los demás módulos de negocio (`auth`, `routes`, `fleet`, `trips`, `bookings`,
`payments`, `tracking`, `notifications`, `reports`) se crean en sus tareas
respectivas siguiendo el patrón documentado en `src/modules/README.md`.
