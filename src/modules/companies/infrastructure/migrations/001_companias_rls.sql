-- T-03: modelo de compañías y aislamiento de datos por compañía (RF-38, RF-39, RF-40).
-- Esquema público "public". Se ejecuta de forma idempotente.
-- El contexto se fija por transacción con set_config('app.company_id', ..., true).
-- current_setting(..., true) devuelve NULL si no hay contexto: en ese caso no se ve ninguna fila.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de compañías (RF-38, RF-39).
CREATE TABLE IF NOT EXISTS companias (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  slug          text NOT NULL UNIQUE,
  administrador_id text NOT NULL,
  activa        boolean NOT NULL DEFAULT true,
  configuracion jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN companias.configuracion IS
  'Tarifa base, políticas y marca propias de la compañía (RF-39). Sin datos de tarjeta.';

-- Tabla de ejemplo para demostrar RF-40: datos que pertenecen a una compañía.
CREATE TABLE IF NOT EXISTS ejemplo_tenant (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companias(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ejemplo_tenant_company_id_idx
  ON ejemplo_tenant (company_id);

-- Row Level Security: refuerzo del aislamiento even si la consulta OLVIDA el filtro.
ALTER TABLE companias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejemplo_tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE companias FORCE ROW LEVEL SECURITY;
ALTER TABLE ejemplo_tenant FORCE ROW LEVEL SECURITY;

-- Política de lectura de compañías: ve sus propios datos o todos si es superadministrador.
-- FORCE incluye al dueño de la tabla, por lo que la API siempre debe fijar el contexto.
DROP POLICY IF EXISTS companias_select_por_compania ON companias;
CREATE POLICY companias_select_por_compania
  ON companias FOR SELECT
  USING (
    current_setting('app.es_superadmin', true) = 'true'
    OR id::text = current_setting('app.company_id', true)
  );

-- Política de escritura de compañías: la propia compañía o el superadministrador.
DROP POLICY IF EXISTS companias_write_por_compania ON companias;
CREATE POLICY companias_write_por_compania
  ON companias FOR ALL
  USING (
    current_setting('app.es_superadmin', true) = 'true'
    OR id::text = current_setting('app.company_id', true)
  )
  WITH CHECK (
    current_setting('app.es_superadmin', true) = 'true'
    OR id::text = current_setting('app.company_id', true)
  );

-- Política de la tabla de ejemplo: sólo filas de la compañía del token.
DROP POLICY IF EXISTS ejemplo_tenant_por_compania ON ejemplo_tenant;
CREATE POLICY ejemplo_tenant_por_compania
  ON ejemplo_tenant FOR ALL
  USING (
    current_setting('app.es_superadmin', true) = 'true'
    OR company_id::text = current_setting('app.company_id', true)
  )
  WITH CHECK (
    current_setting('app.es_superadmin', true) = 'true'
    OR company_id::text = current_setting('app.company_id', true)
  );
