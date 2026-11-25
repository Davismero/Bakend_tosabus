import { Compania } from '../domain/compania.entity';
import { CompanyRepository } from '../domain/company.repository';
import { puedeAcceder, ContextoSeguridad } from './contexto-seguridad';
import {
  AccesoDenegadoCompania,
  CompaniaNoEncontrada,
} from './errores-aplicacion';

/** Caso de uso: consultar una compañía (RF-38, RF-40). */
export class ObtenerCompania {
  constructor(private readonly repositorio: CompanyRepository) {}

  async ejecutar(
    companiaId: string,
    contexto: ContextoSeguridad,
  ): Promise<Compania> {
    if (!puedeAcceder(contexto, companiaId)) {
      throw new AccesoDenegadoCompania();
    }

    const compania = await this.repositorio.obtenerPorId(companiaId);
    if (!compania) {
      throw new CompaniaNoEncontrada();
    }
    return compania;
  }
}
