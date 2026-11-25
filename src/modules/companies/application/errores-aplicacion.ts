/** Errores de caso de uso, independientes del framework HTTP. */
export class CompaniaNoEncontrada extends Error {
  constructor() {
    super('Compañía no encontrada');
    this.name = 'CompaniaNoEncontrada';
  }
}

export class AccesoDenegadoCompania extends Error {
  constructor() {
    super('No tiene permiso sobre esta compañía');
    this.name = 'AccesoDenegadoCompania';
  }
}

export class SlugYaRegistrado extends Error {
  constructor() {
    super('El identificador de la compañía ya está registrado');
    this.name = 'SlugYaRegistrado';
  }
}
