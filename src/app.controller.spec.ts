import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controlador: AppController;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controlador = modulo.get(AppController);
  });

  it('informa que el servicio está disponible', () => {
    expect(controlador.salud()).toEqual({ estado: 'ok', servicio: 'tosabus-api' });
  });
});
