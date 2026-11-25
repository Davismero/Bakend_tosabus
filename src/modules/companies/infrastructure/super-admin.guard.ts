import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { ContextoSeguridad } from '../application/contexto-seguridad';
import { CompanyContext } from './company-context';

/** Guard mínimo: exige rol de superadministrador para altas, bajas y consulta global. */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly companyContext: CompanyContext) {}

  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto
      .switchToHttp()
      .getRequest<Request & { contexto?: ContextoSeguridad }>();
    peticion.contexto = this.companyContext.obtener(peticion);
    if (peticion.contexto.rol !== 'superadministrador') {
      throw new ForbiddenException('Se requiere el rol de superadministrador');
    }
    return true;
  }
}
