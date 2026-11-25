import { validarVariablesEntorno } from './env.validation';

function configuracionBase(): Record<string, unknown> {
  return { JWT_SECRET: 'secreto-de-prueba-con-longitud-suficiente' };
}

describe('validarVariablesEntorno', () => {
  it('aplica valores por defecto para el entorno local', () => {
    const configuracion = validarVariablesEntorno(configuracionBase());

    expect(configuracion.NODE_ENV).toBe('development');
    expect(configuracion.PORT).toBe(3000);
    expect(configuracion.POSTGRES_DB).toBe('tosabus');
    expect(configuracion.DATABASE_URL).toContain('postgresql://');
  });

  it('rechaza un secreto JWT demasiado corto', () => {
    expect(() => validarVariablesEntorno({ JWT_SECRET: 'corto' })).toThrow(
      /Variables de entorno inválidas/,
    );
  });

  it('rechaza un puerto fuera de rango', () => {
    expect(() =>
      validarVariablesEntorno({ ...configuracionBase(), PORT: 70000 }),
    ).toThrow(/Variables de entorno inválidas/);
  });
});
