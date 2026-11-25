import { Compania } from '../domain/compania.entity';
import { CompanyRepository } from '../domain/company.repository';
import { CompaniaNoEncontrada } from './errores-aplicacion';

/** Caso de uso: desactivar una compañía (RF-38). */
export class DesactivarCompania {
  constructor(private readonly repositorio: CompanyRepository) {}

  async ejecutar(companiaId: string): Promise<Compania> {
    const compania = await this.repositorio.desactivar(companiaId);
    if (!compania) {
      throw new CompaniaNoEncontrada();
    }
    return compania;
  }
}
