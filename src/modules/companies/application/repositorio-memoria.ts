import { Compania } from '../domain/compania.entity';
import { ConfiguracionCompania } from '../domain/configuracion-compania';
import { CompanyRepository } from '../domain/company.repository';

/** Dobles de prueba: repositorio en memoria, sin base de datos ni internet. */
export class RepositorioMemoria implements CompanyRepository {
  private readonly companias = new Map<string, Compania>();

  async crear(compania: Compania): Promise<Compania> {
    if ([...this.companias.values()].some((c) => c.slug === compania.slug)) {
      throw new Error('El slug ya está registrado (unique violation)');
    }
    this.companias.set(compania.id, compania);
    return compania;
  }

  async obtenerPorId(id: string): Promise<Compania | null> {
    return this.companias.get(id) ?? null;
  }

  async desactivar(id: string): Promise<Compania | null> {
    const compania = this.companias.get(id);
    if (!compania) {
      return null;
    }
    compania.desactivar();
    return compania;
  }

  async actualizarConfiguracion(
    id: string,
    configuracion: ConfiguracionCompania,
  ): Promise<Compania | null> {
    const compania = this.companias.get(id);
    if (!compania) {
      return null;
    }
    compania.actualizarConfiguracion(configuracion);
    return compania;
  }

  /** Solo para pruebas: precarga una compañía. */
  sembrar(compania: Compania): void {
    this.companias.set(compania.id, compania);
  }
}
