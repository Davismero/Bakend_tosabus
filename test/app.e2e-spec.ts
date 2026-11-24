import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PREFIJO_GLOBAL } from '../src/config/api';
import { AppModule } from '../src/app.module';

describe('API (e2e)', () => {
  let aplicacion: INestApplication;

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    aplicacion = modulo.createNestApplication();
    aplicacion.setGlobalPrefix(PREFIJO_GLOBAL);
    await aplicacion.init();
  });

  afterAll(async () => {
    if (aplicacion) {
      await aplicacion.close();
    }
  });

  it('responde al estado de salud sin base de datos', async () => {
    await request(aplicacion.getHttpServer())
      .get(`/${PREFIJO_GLOBAL}/health`)
      .expect(200)
      .expect({ estado: 'ok', servicio: 'tosabus-api' });
  });
});
