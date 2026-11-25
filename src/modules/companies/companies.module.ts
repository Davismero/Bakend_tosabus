import { Module, Scope } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ActualizarConfiguracion } from './application/actualizar-configuracion.use-case';
import { ContextoSeguridad } from './application/contexto-seguridad';
import { CrearCompania } from './application/crear-compania.use-case';
import { DesactivarCompania } from './application/desactivar-compania.use-case';
import { ObtenerCompania } from './application/obtener-compania.use-case';
import { CompanyRepository } from './domain/company.repository';
import { CompaniesController } from './adapters/in/companies.controller';
import { CompanyContext, CompanyGuard } from './infrastructure/company-context';
import { DatabasePort, PgDatabase } from './infrastructure/database';
import { PostgresCompanyRepository } from './infrastructure/postgres-company.repository';
import { SuperAdminGuard } from './infrastructure/super-admin.guard';
import { COMPANY_REPOSITORY, DATABASE_PORT } from './infrastructure/tokens';

/**
 * Módulo companies (T-03). El repositorio es por petición: el companyId se toma
 * del JWT de cada solicitud, nunca de parámetros del cliente (RF-40).
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}), // T-05 configurará la emisión de tokens; aquí sólo se verifica.
  ],
  controllers: [CompaniesController],
  providers: [
    CompanyContext,
    CompanyGuard,
    SuperAdminGuard,
    {
      provide: DATABASE_PORT,
      inject: [ConfigService],
      useFactory: (configuracion: ConfigService): DatabasePort =>
        new PgDatabase(
          configuracion.get<string>('DATABASE_URL') ??
            'postgresql://tosabus:tosabus@localhost:5432/tosabus',
        ),
    },
    {
      provide: COMPANY_REPOSITORY,
      scope: Scope.REQUEST,
      inject: [DATABASE_PORT, CompanyContext, REQUEST],
      useFactory: (
        base: DatabasePort,
        companyContext: CompanyContext,
        peticion: Request,
      ): CompanyRepository => {
        const contextoConRequest = peticion as Request & {
          contexto?: ContextoSeguridad;
        };
        const contexto =
          contextoConRequest.contexto ?? companyContext.obtener(peticion);
        return new PostgresCompanyRepository(base, contexto);
      },
    },
    {
      provide: CrearCompania,
      inject: [COMPANY_REPOSITORY],
      useFactory: (repositorio: CompanyRepository): CrearCompania =>
        new CrearCompania(repositorio),
    },
    {
      provide: DesactivarCompania,
      inject: [COMPANY_REPOSITORY],
      useFactory: (repositorio: CompanyRepository): DesactivarCompania =>
        new DesactivarCompania(repositorio),
    },
    {
      provide: ActualizarConfiguracion,
      inject: [COMPANY_REPOSITORY],
      useFactory: (repositorio: CompanyRepository): ActualizarConfiguracion =>
        new ActualizarConfiguracion(repositorio),
    },
    {
      provide: ObtenerCompania,
      inject: [COMPANY_REPOSITORY],
      useFactory: (repositorio: CompanyRepository): ObtenerCompania =>
        new ObtenerCompania(repositorio),
    },
  ],
  exports: [COMPANY_REPOSITORY, CompanyContext],
})
export class CompaniesModule {}
