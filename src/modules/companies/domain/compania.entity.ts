import {
  ConfiguracionCompania,
  ErrorDominioCompania,
  validarConfiguracion,
  validarSlug,
} from './configuracion-compania';

/**
 * Entidad Compañía (raíz del dominio multi-compañía).
 * El identificador es un UUID generado fuera del dominio (por la infraestructura).
 * Reglas puras: crear, desactivar y actualizar la configuración propia (RF-38, RF-39).
 * Sin importar NestJS, ORM ni SDK externos.
 */
export class Compania {
  private constructor(
    readonly id: string,
    readonly nombre: string,
    readonly slug: string,
    /** Referencia opaca al administrador de la compañía; T-04 creará el usuario real. */
    readonly administradorId: string,
    private activa: boolean,
    private configuracion: ConfiguracionCompania,
    readonly creadaEn: Date,
  ) {}

  /** Crea una compañía nueva, activa y con la configuración indicada. */
  static crear(datos: {
    id: string;
    nombre: string;
    slug: string;
    administradorId: string;
    configuracion: ConfiguracionCompania;
    creadaEn?: Date;
  }): Compania {
    if (datos.nombre.trim().length === 0) {
      throw new ErrorDominioCompania('El nombre de la compañía es obligatorio');
    }
    if (datos.administradorId.trim().length === 0) {
      throw new ErrorDominioCompania(
        'El administrador de la compañía es obligatorio',
      );
    }
    validarSlug(datos.slug);
    validarConfiguracion(datos.configuracion);
    return new Compania(
      datos.id,
      datos.nombre.trim(),
      datos.slug,
      datos.administradorId.trim(),
      true,
      datos.configuracion,
      datos.creadaEn ?? new Date(),
    );
  }

  /** Reconstruye una compañía desde persistencia sin revalidar reglas de creación. */
  static restaurar(datos: {
    id: string;
    nombre: string;
    slug: string;
    administradorId: string;
    activa: boolean;
    configuracion: ConfiguracionCompania;
    creadaEn: Date;
  }): Compania {
    return new Compania(
      datos.id,
      datos.nombre,
      datos.slug,
      datos.administradorId,
      datos.activa,
      datos.configuracion,
      datos.creadaEn,
    );
  }

  get estaActiva(): boolean {
    return this.activa;
  }

  get configuracionActual(): ConfiguracionCompania {
    return this.configuracion;
  }

  /** Desactiva la compañía. Una compañía ya desactivada no cambia (RF-38). */
  desactivar(): void {
    if (!this.activa) {
      throw new ErrorDominioCompania('La compañía ya está desactivada');
    }
    this.activa = false;
  }

  /** Actualiza la configuración propia; los cambios no afectan a otras compañías (RF-39). */
  actualizarConfiguracion(nueva: ConfiguracionCompania): void {
    validarConfiguracion(nueva);
    this.configuracion = nueva;
  }
}
