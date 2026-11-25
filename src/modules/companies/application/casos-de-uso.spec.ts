import { Compania } from '../domain/compania.entity';
import { ConfiguracionCompania } from '../domain/configuracion-compania';
import { ActualizarConfiguracion } from './actualizar-configuracion.use-case';
import { ContextoSeguridad } from './contexto-seguridad';
import { CrearCompania } from './crear-compania.use-case';
import {
  AccesoDenegadoCompania,
  CompaniaNoEncontrada,
  SlugYaRegistrado,
} from './errores-aplicacion';
import { DesactivarCompania } from './desactivar-compania.use-case';
import { ObtenerCompania } from './obtener-compania.use-case';
import { RepositorioMemoria } from './repositorio-memoria';

function configuracion(centavos = 250): ConfiguracionCompania {
  return {
    tarifaBase: { centavos, moneda: 'USD' },
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

function compania(id: string, slug: string): Compania {
  return Compania.crear({
    id,
    nombre: `Compañía ${id}`,
    slug,
    administradorId: `admin-${id}`,
    configuracion: configuracion(),
  });
}

const superAdmin: ContextoSeguridad = {
  companyId: 'sin-compania',
  rol: 'superadministrador',
};
const adminA: ContextoSeguridad = {
  companyId: 'compania-a',
  rol: 'administrador',
};

describe('Casos de uso de compañías', () => {
  describe('CrearCompania (RF-38)', () => {
    it('crea una compañía activa con su administrador', async () => {
      const repositorio = new RepositorioMemoria();
      const caso = new CrearCompania(repositorio, () => 'nueva-id');

      const creada = await caso.ejecutar({
        nombre: 'Cooperativa Nueva',
        slug: 'cooperativa-nueva',
        administradorId: 'admin-nuevo',
        configuracion: configuracion(),
      });

      expect(creada.id).toBe('nueva-id');
      expect(creada.estaActiva).toBe(true);
      expect(creada.administradorId).toBe('admin-nuevo');
    });

    it('rechaza un slug ya registrado', async () => {
      const repositorio = new RepositorioMemoria();
      repositorio.sembrar(compania('existente', 'cooperativa-nueva'));
      const caso = new CrearCompania(repositorio, () => 'otra-id');

      await expect(
        caso.ejecutar({
          nombre: 'Otra',
          slug: 'cooperativa-nueva',
          administradorId: 'admin',
          configuracion: configuracion(),
        }),
      ).rejects.toBeInstanceOf(SlugYaRegistrado);
    });
  });

  describe('DesactivarCompania (RF-38)', () => {
    it('desactiva una compañía existente', async () => {
      const repositorio = new RepositorioMemoria();
      const original = compania('a', 'compania-a');
      repositorio.sembrar(original);

      const desactivada = await new DesactivarCompania(repositorio).ejecutar(
        'a',
      );

      expect(desactivada.estaActiva).toBe(false);
    });

    it('falla si la compañía no existe', async () => {
      await expect(
        new DesactivarCompania(new RepositorioMemoria()).ejecutar(
          'inexistente',
        ),
      ).rejects.toBeInstanceOf(CompaniaNoEncontrada);
    });
  });

  describe('ActualizarConfiguracion (RF-39, RF-40)', () => {
    it('el administrador actualiza la configuración de su propia compañía', async () => {
      const repositorio = new RepositorioMemoria();
      repositorio.sembrar(compania('compania-a', 'compania-a'));
      repositorio.sembrar(compania('compania-b', 'compania-b'));

      await new ActualizarConfiguracion(repositorio).ejecutar(
        'compania-a',
        configuracion(999),
        adminA,
      );

      expect(
        (await repositorio.obtenerPorId('compania-a'))?.configuracionActual
          .tarifaBase.centavos,
      ).toBe(999);
      expect(
        (await repositorio.obtenerPorId('compania-b'))?.configuracionActual
          .tarifaBase.centavos,
      ).toBe(250);
    });

    it('niega a un administrador que intenta modificar otra compañía (RF-40)', async () => {
      const repositorio = new RepositorioMemoria();
      repositorio.sembrar(compania('compania-b', 'compania-b'));

      await expect(
        new ActualizarConfiguracion(repositorio).ejecutar(
          'compania-b',
          configuracion(999),
          adminA,
        ),
      ).rejects.toBeInstanceOf(AccesoDenegadoCompania);
      expect(
        (await repositorio.obtenerPorId('compania-b'))?.configuracionActual
          .tarifaBase.centavos,
      ).toBe(250);
    });
  });

  describe('ObtenerCompania (RF-38, RF-40)', () => {
    it('el superadministrador consulta cualquier compañía', async () => {
      const repositorio = new RepositorioMemoria();
      repositorio.sembrar(compania('compania-a', 'compania-a'));

      const obtenida = await new ObtenerCompania(repositorio).ejecutar(
        'compania-a',
        superAdmin,
      );
      expect(obtenida.id).toBe('compania-a');
    });

    it('niega a un usuario de la compañía A consultar la compañía B (RF-40)', async () => {
      const repositorio = new RepositorioMemoria();
      repositorio.sembrar(compania('compania-b', 'compania-b'));

      await expect(
        new ObtenerCompania(repositorio).ejecutar('compania-b', adminA),
      ).rejects.toBeInstanceOf(AccesoDenegadoCompania);
    });

    it('falla si la compañía no existe', async () => {
      await expect(
        new ObtenerCompania(new RepositorioMemoria()).ejecutar(
          'inexistente',
          superAdmin,
        ),
      ).rejects.toBeInstanceOf(CompaniaNoEncontrada);
    });
  });
});
