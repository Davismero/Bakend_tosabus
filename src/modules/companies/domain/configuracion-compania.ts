/**
 * Configuración propia de una compañía (RF-39).
 * Tipos puros del dominio: sin dependencias de NestJS, ORM ni SDK externos.
 */

/** Tarifa base ficticia en centavos, para evitar cálculos con punto flotante. */
export interface TarifaBase {
  /** Importe en centavos de la moneda local. Debe ser mayor que cero. */
  centavos: number;
  /** Código ISO 4217, por ejemplo "USD". */
  moneda: string;
}

/** Políticas de la compañía que afectan a sus propias reservas. */
export interface PoliticasCompania {
  /** Días de anticipación máximos para reservar. */
  diasAnticipacion: number;
  /** Minutos antes de la salida en que se cancela sin costo. */
  minutosCancelacionGratis: number;
  /** Texto de la política, en español. */
  texto: string;
}

/** Elementos de marca que la compañía puede configurar para sí misma. */
export interface MarcaCompania {
  /** Nombre comercial mostrado al pasajero. */
  nombreComercial: string;
  /** Color principal en hexadecimal, por ejemplo "#1F7A33". */
  colorPrimario: string;
  /** URL pública del logo; nunca se guardan imágenes de terceros sin autorización. */
  logoUrl: string | null;
}

/** Configuración completa de una compañía (RF-39). */
export interface ConfiguracionCompania {
  tarifaBase: TarifaBase;
  politicas: PoliticasCompania;
  marca: MarcaCompania;
}

/** Errores de dominio lanzados al validar reglas de la compañía. */
export class ErrorDominioCompania extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDominioCompania';
  }
}

const COLOR_HEX = /^#[0-9A-Fa-f]{6}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MONEDA = /^[A-Z]{3}$/;

/** Valida la tarifa base: importe positivo y moneda ISO de tres letras. */
export function validarTarifaBase(tarifa: TarifaBase): void {
  if (!Number.isInteger(tarifa.centavos) || tarifa.centavos <= 0) {
    throw new ErrorDominioCompania(
      'La tarifa base debe ser un entero positivo en centavos',
    );
  }
  if (!MONEDA.test(tarifa.moneda)) {
    throw new ErrorDominioCompania(
      'La moneda debe tener tres letras mayúsculas (ISO 4217)',
    );
  }
}

/** Valida que las políticas tengan valores coherentes y texto en español. */
export function validarPoliticas(politicas: PoliticasCompania): void {
  if (
    !Number.isInteger(politicas.diasAnticipacion) ||
    politicas.diasAnticipacion < 0
  ) {
    throw new ErrorDominioCompania(
      'Los días de anticipación no pueden ser negativos',
    );
  }
  if (
    !Number.isInteger(politicas.minutosCancelacionGratis) ||
    politicas.minutosCancelacionGratis < 0
  ) {
    throw new ErrorDominioCompania(
      'Los minutos de cancelación gratis no pueden ser negativos',
    );
  }
  if (politicas.texto.trim().length === 0) {
    throw new ErrorDominioCompania('El texto de las políticas es obligatorio');
  }
}

/** Valida los datos de marca: colores hexadecimales y nombre comercial no vacío. */
export function validarMarca(marca: MarcaCompania): void {
  if (marca.nombreComercial.trim().length === 0) {
    throw new ErrorDominioCompania('El nombre comercial es obligatorio');
  }
  if (!COLOR_HEX.test(marca.colorPrimario)) {
    throw new ErrorDominioCompania(
      'El color principal debe ser hexadecimal de seis dígitos',
    );
  }
}

/** Valida la configuración completa antes de guardarla. */
export function validarConfiguracion(
  configuracion: ConfiguracionCompania,
): void {
  validarTarifaBase(configuracion.tarifaBase);
  validarPoliticas(configuracion.politicas);
  validarMarca(configuracion.marca);
}

/** Valida el identificador único (slug) usado como clave pública de la compañía. */
export function validarSlug(slug: string): void {
  if (!SLUG.test(slug)) {
    throw new ErrorDominioCompania(
      'El identificador debe usar letras minúsculas, números y guiones',
    );
  }
}
