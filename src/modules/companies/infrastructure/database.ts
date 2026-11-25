import { Pool, PoolClient, QueryResultRow } from 'pg';

/**
 * Puerto de salida a la base de datos, para no acoplar los adaptadores a `pg`.
 * Permite sustituir el driver por un doble de prueba sin internet.
 */
export interface DatabasePort {
  /** Ejecuta una consulta con un contexto de compañía (SET LOCAL app.company_id). */
  conContexto<T extends QueryResultRow>(
    companyId: string,
    sql: string,
    parametros: unknown[],
  ): Promise<T[]>;
  /** Ejecuta una consulta sin contexto, para operaciones de superadministrador. */
  sinContexto<T extends QueryResultRow>(
    sql: string,
    parametros: unknown[],
  ): Promise<T[]>;
  /** Ejecuta un archivo de migración completo. */
  ejecutarScript(sql: string): Promise<void>;
  cerrar(): Promise<void>;
}

/** Adaptador PostgreSQL basado en el pool de `pg`. */
export class PgDatabase implements DatabasePort {
  private readonly pool: Pool;

  constructor(url: string) {
    this.pool = new Pool({ connectionString: url });
  }

  private async conCliente<T>(
    companyId: string | null,
    sql: string,
    parametros: unknown[],
  ): Promise<T[]> {
    const cliente: PoolClient = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      if (companyId !== null) {
        // El identificador se fija desde el token, nunca desde el cliente HTTP.
        await cliente.query('SELECT set_config($1, $2, true)', [
          'app.company_id',
          companyId,
        ]);
        await cliente.query(
          "SELECT set_config('app.es_superadmin', 'false', true)",
        );
      } else {
        await cliente.query(
          "SELECT set_config('app.es_superadmin', 'true', true)",
        );
      }
      const resultado = await cliente.query(sql, parametros);
      await cliente.query('COMMIT');
      return resultado.rows as T[];
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  }

  async conContexto<T extends QueryResultRow>(
    companyId: string,
    sql: string,
    parametros: unknown[],
  ): Promise<T[]> {
    return this.conCliente<T>(companyId, sql, parametros);
  }

  async sinContexto<T extends QueryResultRow>(
    sql: string,
    parametros: unknown[],
  ): Promise<T[]> {
    return this.conCliente<T>(null, sql, parametros);
  }

  async ejecutarScript(sql: string): Promise<void> {
    const cliente = await this.pool.connect();
    try {
      await cliente.query(sql);
    } finally {
      cliente.release();
    }
  }

  async cerrar(): Promise<void> {
    await this.pool.end();
  }
}
