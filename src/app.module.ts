import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { validarVariablesEntorno } from './config/env.validation';
import { CompaniesModule } from './modules/companies/companies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validarVariablesEntorno,
      cache: true,
    }),
    CompaniesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
