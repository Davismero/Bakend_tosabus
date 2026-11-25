import { Compania } from '../domain/compania.entity';
import { ConfiguracionCompania } from '../domain/configuracion-compania';
import { CompanyRepository } from '../domain/company.repository';
import { puedeAcceder, ContextoSeguridad } from './contexto-seguridad';
import {
  AccesoDenegadoCompania,
  CompaniaNoEncontrada,
} from './errores-aplicacion';

/**
 * Caso de uso: actualizar la configuración propia de una compañía (RF-39).
 * Verifica que el solicitante pertenezca a esa compañía, aunque manipule la URL (RF-40).
 */
export class ActualizarConfiguracion {
  constructor(private readonly repositorio: CompanyRepository) {}

  async ejecutar(
    companiaId: string,
    configuracion: ConfiguracionCompania,
    contexto: ContextoSeguridad,
  ): Promise<Compania> {
    if (!puedeAcceder(contexto, companiaId)) {
      throw new AccesoDenegadoCompania();
    }

    const actualizada = await this.repositorio.actualizarConfiguracion(
      companiaId,
      configuracion,
    );
    if (!actualizada) {
      throw new CompaniaNoEncontrada();
    }
    return actualizada;
  }
}
