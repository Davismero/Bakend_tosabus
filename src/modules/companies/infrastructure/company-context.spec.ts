import { ConfigService } from '@nestjs/config';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CompanyContext, CompanyGuard } from './company-context';
import { SuperAdminGuard } from './super-admin.guard';

const SECRETO = 'secreto-de-prueba-con-longitud-suficiente-123456';

function contextoHttp(cabecera?: string): {
  ejecucion: ExecutionContext;
  peticion: Request & { contexto?: unknown };
} {
  const peticion = {
    headers: cabecera ? { authorization: cabecera } : {},
  } as Request & {
    contexto?: unknown;
  };
  const ejecucion = {
    switchToHttp: () => ({ getRequest: () => peticion }),
  } as ExecutionContext;
  return { ejecucion, peticion };
}

function crearContexto(): CompanyContext {
  const jwt = new JwtService({});
  const configuracion = { get: () => SECRETO } as unknown as ConfigService;
  return new CompanyContext(jwt, configuracion);
}

function token(datos: Record<string, unknown>): string {
  return new JwtService({}).sign(datos, { secret: SECRETO });
}

describe('CompanyContext y guards (RF-40)', () => {
  it('extrae companyId y rol del JWT, nunca de parámetros', () => {
    const companyContext = crearContexto();
    const { peticion } = contextoHttp(
      `Bearer ${token({ companyId: 'compania-a', rol: 'administrador' })}`,
    );
    const contexto = companyContext.obtener(peticion);
    expect(contexto).toEqual({ companyId: 'compania-a', rol: 'administrador' });
  });

  it('rechaza peticiones sin token', () => {
    const companyContext = crearContexto();
    const { peticion } = contextoHttp();
    expect(() => companyContext.obtener(peticion)).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un token manipulado con otro secreto', () => {
    const companyContext = crearContexto();
    const tokenAjeno = new JwtService({}).sign(
      { companyId: 'compania-b', rol: 'administrador' },
      { secret: 'otro-secreto-de-prueba-con-longitud-suficiente' },
    );
    const { peticion } = contextoHttp(`Bearer ${tokenAjeno}`);
    expect(() => companyContext.obtener(peticion)).toThrow(
      UnauthorizedException,
    );
  });

  it('CompanyGuard expone el contexto en la petición', () => {
    const guard = new CompanyGuard(crearContexto());
    const { ejecucion, peticion } = contextoHttp(
      `Bearer ${token({ companyId: 'compania-a', rol: 'administrador' })}`,
    );
    expect(guard.canActivate(ejecucion)).toBe(true);
    expect(peticion.contexto).toEqual({
      companyId: 'compania-a',
      rol: 'administrador',
    });
  });

  it('SuperAdminGuard niega a un administrador de compañía', () => {
    const guard = new SuperAdminGuard(crearContexto());
    const { ejecucion } = contextoHttp(
      `Bearer ${token({ companyId: 'compania-a', rol: 'administrador' })}`,
    );
    expect(() => guard.canActivate(ejecucion)).toThrow(ForbiddenException);
  });

  it('SuperAdminGuard permite al superadministrador', () => {
    const guard = new SuperAdminGuard(crearContexto());
    const { ejecucion, peticion } = contextoHttp(
      `Bearer ${token({ rol: 'superadministrador' })}`,
    );
    expect(guard.canActivate(ejecucion)).toBe(true);
    expect(peticion.contexto).toEqual({
      companyId: 'sin-compania',
      rol: 'superadministrador',
    });
  });

  it('RF-40: token de la compañía A no puede acceder a la compañía B', () => {
    const companyContext = crearContexto();
    const guard = new CompanyGuard(companyContext);
    // El atacante manipula la URL/parámetros, pero el guard usa sólo el JWT.
    const { ejecucion, peticion } = contextoHttp(
      `Bearer ${token({ companyId: 'compania-a', rol: 'administrador' })}`,
    );
    guard.canActivate(ejecucion);
    expect(peticion.contexto).toMatchObject({ companyId: 'compania-a' });
    expect(peticion.contexto).not.toMatchObject({ companyId: 'compania-b' });
  });
});
