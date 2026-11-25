import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PgDatabase } from './database';

/** Aplica la migración SQL de T-03. La URL se toma del entorno, nunca se guarda en el repo. */
async function main(): Promise<void> {
  // Valor por defecto solo para desarrollo local; en producción se exige la variable.
  const url =
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('DATABASE_URL no está definida');
        })()
      : 'postgresql://tosabus:tosabus@localhost:5432/tosabus');

  const ruta = join(__dirname, 'migrations', '001_companias_rls.sql');
  const sql = readFileSync(ruta, 'utf8');
  const base = new PgDatabase(url);
  try {
    await base.ejecutarScript(sql);
    process.stdout.write(
      'Migración T-03 aplicada correctamente (companias, ejemplo_tenant, RLS).\n',
    );
  } finally {
    await base.cerrar();
  }
}

void main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error al aplicar la migración T-03: ${mensaje}\n`);
  process.exitCode = 1;
});
