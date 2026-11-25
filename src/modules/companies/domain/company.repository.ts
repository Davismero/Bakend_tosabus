import { Compania } from './compania.entity';
import { ConfiguracionCompania } from './configuracion-compania';

/**
 * Puerto de salida del repositorio de compañías.
 * La aplicación depende de esta interfaz, nunca del adaptador PostgreSQL.
 * El contexto de compañía (JWT) se aplica en el adaptador, no aquí.
 */
export interface CompanyRepository {
  /** Guarda una compañía nueva. El slug único se enforce en base de datos. */
  crear(compania: Compania): Promise<Compania>;

  /** Busca una compañía por su identificador. Devuelve null si no existe o no es visible. */
  obtenerPorId(id: string): Promise<Compania | null>;

  /** Desactiva una compañía por su identificador. */
  desactivar(id: string): Promise<Compania | null>;

  /** Actualiza la configuración de una compañía (RF-39). */
  actualizarConfiguracion(
    id: string,
    configuracion: ConfiguracionCompania,
  ): Promise<Compania | null>;
}
