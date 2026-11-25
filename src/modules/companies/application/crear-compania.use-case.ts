import { Compania } from '../domain/compania.entity';
import { ConfiguracionCompania } from '../domain/configuracion-compania';
import { CompanyRepository } from '../domain/company.repository';
import { SlugYaRegistrado } from './errores-aplicacion';

/**
 * Caso de uso: dar de alta una compañía con su administrador (RF-38).
 * Solo lo invoca el controlador tras validar el rol de superadministrador.
 */
export class CrearCompania {
  constructor(
    private readonly repositorio: CompanyRepository,
    private readonly generadorId: () => string = () => crypto.randomUUID(),
  ) {}

  async ejecutar(datos: {
    nombre: string;
    slug: string;
    administradorId: string;
    configuracion: ConfiguracionCompania;
  }): Promise<Compania> {
    const compania = Compania.crear({
      id: this.generadorId(),
      nombre: datos.nombre,
      slug: datos.slug,
      administradorId: datos.administradorId,
      configuracion: datos.configuracion,
    });

    try {
      return await this.repositorio.crear(compania);
    } catch (error) {
      if (error instanceof Error && error.message.includes('slug')) {
        throw new SlugYaRegistrado();
      }
      throw error;
    }
  }
}
