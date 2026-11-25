import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ContextoSeguridad } from '../application/contexto-seguridad';

/** Claims mínimos esperados en el JWT (T-05 emitirá el token completo). */
interface ClaimsJwt {
  sub?: string;
  companyId?: string;
  rol?: ContextoSeguridad['rol'];
}

/**
 * Extrae el contexto de compañía del JWT de la cabecera Authorization.
 * El companyId NUNCA se lee del cuerpo, la consulta ni los parámetros: RF-40.
 * T-05 completará la emisión del token y endurecerá la verificación de firma.
 */
@Injectable()
export class CompanyContext {
  constructor(
    private readonly jwt: JwtService,
    private readonly configuracion: ConfigService,
  ) {}

  /** Devuelve el contexto de seguridad de la petición o lanza 401. */
  obtener(request: Request): ContextoSeguridad {
    const cabecera = request.headers.authorization;
    if (!cabecera?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Se requiere un token Bearer');
    }

    const token = cabecera.slice('Bearer '.length).trim();
    let claims: ClaimsJwt;
    try {
      claims = this.jwt.verify<ClaimsJwt>(token, {
        secret: this.configuracion.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (!claims.rol || !this.esRolValido(claims.rol)) {
      throw new UnauthorizedException('El token no contiene un rol válido');
    }

    const companyId =
      claims.rol === 'superadministrador'
        ? (claims.companyId ?? 'sin-compania')
        : claims.companyId;

    if (!companyId) {
      throw new UnauthorizedException(
        'El token no contiene la compañía del usuario',
      );
    }

    return { companyId, rol: claims.rol };
  }

  private esRolValido(rol: string): rol is ContextoSeguridad['rol'] {
    return [
      'pasajero',
      'conductor',
      'administrador',
      'superadministrador',
    ].includes(rol);
  }
}

/** Guard que valida la presencia de un JWT y expone el contexto en `request`. */
@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(private readonly companyContext: CompanyContext) {}

  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto
      .switchToHttp()
      .getRequest<Request & { contexto?: ContextoSeguridad }>();
    peticion.contexto = this.companyContext.obtener(peticion);
    return true;
  }
}
