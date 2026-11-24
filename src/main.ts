import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PREFIJO_GLOBAL } from './config/api';
import { AppModule } from './app.module';

function origenesPermitidos(configuracion: ConfigService): string[] | '*' {
  const crudos = configuracion.get<string>('CORS_ORIGINS', '');
  const origenes = crudos
    .split(',')
    .map((origen) => origen.trim())
    .filter((origen) => origen.length > 0);

  return origenes.includes('*') ? '*' : origenes;
}

async function bootstrap(): Promise<void> {
  const aplicacion = await NestFactory.create(AppModule);
  const configuracion = aplicacion.get(ConfigService);

  aplicacion.setGlobalPrefix(PREFIJO_GLOBAL);
  aplicacion.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  aplicacion.enableCors({ origin: origenesPermitidos(configuracion) });

  const documento = new DocumentBuilder()
    .setTitle('TosaBus API')
    .setDescription('API REST de TosaBus. Documentación de los endpoints disponibles.')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', aplicacion, SwaggerModule.createDocument(aplicacion, documento));

  const puerto = configuracion.get<number>('PORT', 3000);
  await aplicacion.listen(puerto);
}

void bootstrap();
