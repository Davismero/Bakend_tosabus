# TosaBus API (backend)

API REST de TosaBus: monolito modular con NestJS, TypeScript estricto y
PostgreSQL. Esta entrega corresponde a **T-01: crear la estructura del
repositorio y el entorno con Docker y PostgreSQL** y cubre **RNF-13**
(despliegue reproducible con Docker siguiendo esta guía). Todavía no hay
módulos de negocio: se agregan desde T-03 en adelante.

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
los valores definidos en `.env`. Configuración de RLS por compañía y acceso
desde la API llegan con el módulo `companies` (T-03, RF-40).

## Migraciones y datos de ejemplo

**Pendiente de tareas futuras.** En T-01 no hay esquema de base de datos,
herramienta de migraciones ni carga de datos. La definición del esquema, las
migraciones y el aislamiento por compañía se introducen con los módulos de
negocio (desde T-03); los datos de ejemplo ficticios y verosímiles se agregan
en T-41. No se usan datos de personas reales ni cobros reales.

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
    └── README.md           # Patrón de capas y módulos previstos
test/
├── setup-env.ts            # Variables ficticias solo para pruebas
└── app.e2e-spec.ts         # Prueba e2e del estado de salud
```

Los módulos de negocio (`auth`, `companies`, `routes`, `fleet`, `trips`,
`bookings`, `payments`, `tracking`, `notifications`, `reports`) se crean en sus
tareas respectivas siguiendo el patrón documentado en `src/modules/README.md`.
