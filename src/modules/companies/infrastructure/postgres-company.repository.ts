import { randomUUID } from 'node:crypto';
import { Compania } from '../domain/compania.entity';
import {
  ConfiguracionCompania,
  validarConfiguracion,
} from '../domain/configuracion-compania';
import { CompanyRepository } from '../domain/company.repository';
import { ContextoSeguridad } from '../application/contexto-seguridad';
import { DatabasePort } from './database';

interface FilaCompania {
  id: string;
  nombre: string;
  slug: string;
  administrador_id: string;
  activa: boolean;
  configuracion: ConfiguracionCompania;
  created_at: Date;
}

function aDominio(fila: FilaCompania): Compania {
  return Compania.restaurar({
    id: fila.id,
    nombre: fila.nombre,
    slug: fila.slug,
    administradorId: fila.administrador_id,
    activa: fila.activa,
    configuracion: fila.configuracion,
    creadaEn: fila.created_at,
  });
}

/**
 * Adaptador de salida PostgreSQL del repositorio de compañías.
 * Toda consulta pasa por el contexto del JWT; nunca acepta un companyId del cliente.
 */
export class PostgresCompanyRepository implements CompanyRepository {
  constructor(
    private readonly baseDeDatos: DatabasePort,
    private readonly contexto: ContextoSeguridad,
  ) {}

  private get esSuperadmin(): boolean {
    return this.contexto.rol === 'superadministrador';
  }

  async crear(compania: Compania): Promise<Compania> {
    if (!this.esSuperadmin) {
      throw new Error('Solo el superadministrador puede crear compañías');
    }
    const filas = await this.baseDeDatos.sinContexto<FilaCompania>(
      `INSERT INTO companias (id, nombre, slug, administrador_id, activa, configuracion)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING id, nombre, slug, administrador_id, activa, configuracion, created_at`,
      [
        compania.id,
        compania.nombre,
        compania.slug,
        compania.administradorId,
        compania.estaActiva,
        JSON.stringify(compania.configuracionActual),
      ],
    );
    return aDominio(filas[0]);
  }

  async obtenerPorId(id: string): Promise<Compania | null> {
    const sql = `SELECT id, nombre, slug, administrador_id, activa, configuracion, created_at
                 FROM companias WHERE id = $1`;
    const filas = this.esSuperadmin
      ? await this.baseDeDatos.sinContexto<FilaCompania>(sql, [id])
      : await this.baseDeDatos.conContexto<FilaCompania>(
          this.contexto.companyId,
          sql,
          [id],
        );
    return filas.length > 0 ? aDominio(filas[0]) : null;
  }

  async desactivar(id: string): Promise<Compania | null> {
    if (!this.esSuperadmin) {
      throw new Error('Solo el superadministrador puede desactivar compañías');
    }
    const filas = await this.baseDeDatos.sinContexto<FilaCompania>(
      `UPDATE companias SET activa = false WHERE id = $1
       RETURNING id, nombre, slug, administrador_id, activa, configuracion, created_at`,
      [id],
    );
    return filas.length > 0 ? aDominio(filas[0]) : null;
  }

  async actualizarConfiguracion(
    id: string,
    configuracion: ConfiguracionCompania,
  ): Promise<Compania | null> {
    validarConfiguracion(configuracion);
    const sql = `UPDATE companias SET configuracion = $2::jsonb WHERE id = $1
                 RETURNING id, nombre, slug, administrador_id, activa, configuracion, created_at`;
    const parametros = [id, JSON.stringify(configuracion)];
    const filas = this.esSuperadmin
      ? await this.baseDeDatos.sinContexto<FilaCompania>(sql, parametros)
      : await this.baseDeDatos.conContexto<FilaCompania>(
          this.contexto.companyId,
          sql,
          parametros,
        );
    return filas.length > 0 ? aDominio(filas[0]) : null;
  }
}

/** Generador de UUID para el caso de uso; Centralizado aquí para T-05. */
export const generarId = (): string => randomUUID();
