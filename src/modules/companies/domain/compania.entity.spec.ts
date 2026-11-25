import { Compania } from './compania.entity';
import {
  ConfiguracionCompania,
  ErrorDominioCompania,
} from './configuracion-compania';

function configuracionValida(): ConfiguracionCompania {
  return {
    tarifaBase: { centavos: 250, moneda: 'USD' },
    politicas: {
      diasAnticipacion: 30,
      minutosCancelacionGratis: 60,
      texto: 'Política de ejemplo',
    },
    marca: {
      nombreComercial: 'Transportes Tosagua',
      colorPrimario: '#1F7A33',
      logoUrl: null,
    },
  };
}

describe('Compañía (dominio)', () => {
  it('se crea activa con la configuración indicada', () => {
    const compania = Compania.crear({
      id: '11111111-1111-4111-8111-111111111111',
      nombre: 'Cooperativa Tosagua',
      slug: 'cooperativa-tosagua',
      administradorId: 'admin-111',
      configuracion: configuracionValida(),
    });

    expect(compania.estaActiva).toBe(true);
    expect(compania.nombre).toBe('Cooperativa Tosagua');
    expect(compania.configuracionActual.tarifaBase.centavos).toBe(250);
  });

  it('rechaza un slug inválido', () => {
    expect(() =>
      Compania.crear({
        id: 'id',
        nombre: 'Cooperativa',
        slug: 'Slug Con Mayúsculas',
        administradorId: 'admin-1',
        configuracion: configuracionValida(),
      }),
    ).toThrow(ErrorDominioCompania);
  });

  it('rechaza una tarifa base menor o igual a cero', () => {
    const configuracion = configuracionValida();
    configuracion.tarifaBase.centavos = 0;
    expect(() =>
      Compania.crear({
        id: 'id',
        nombre: 'Cooperativa',
        slug: 'cooperativa',
        administradorId: 'admin-1',
        configuracion,
      }),
    ).toThrow(/tarifa base/);
  });

  it('se desactiva y no puede desactivarse dos veces', () => {
    const compania = Compania.crear({
      id: 'id',
      nombre: 'Cooperativa',
      slug: 'cooperativa',
      administradorId: 'admin-1',
      configuracion: configuracionValida(),
    });

    compania.desactivar();
    expect(compania.estaActiva).toBe(false);
    expect(() => compania.desactivar()).toThrow(/ya está desactivada/);
  });

  it('actualiza su configuración sin afectar a otras compañías', () => {
    const primera = Compania.crear({
      id: 'a',
      nombre: 'Compañía A',
      slug: 'compania-a',
      administradorId: 'admin-a',
      configuracion: configuracionValida(),
    });
    const segunda = Compania.crear({
      id: 'b',
      nombre: 'Compañía B',
      slug: 'compania-b',
      administradorId: 'admin-b',
      configuracion: configuracionValida(),
    });

    const nueva = configuracionValida();
    nueva.tarifaBase.centavos = 999;
    primera.actualizarConfiguracion(nueva);

    expect(primera.configuracionActual.tarifaBase.centavos).toBe(999);
    expect(segunda.configuracionActual.tarifaBase.centavos).toBe(250);
  });

  it('rechaza una configuración de marca inválida', () => {
    const configuracion = configuracionValida();
    configuracion.marca.colorPrimario = 'verde';
    expect(() =>
      Compania.crear({
        id: 'id',
        nombre: 'Cooperativa',
        slug: 'cooperativa',
        administradorId: 'admin-1',
        configuracion,
      }),
    ).toThrow(/color principal/);
  });
});
