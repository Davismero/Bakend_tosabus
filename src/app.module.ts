import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { validarVariablesEntorno } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validarVariablesEntorno,
      cache: true,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
