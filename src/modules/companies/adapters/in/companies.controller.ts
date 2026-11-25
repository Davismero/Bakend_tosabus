import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  ContextoSeguridad,
  puedeAcceder,
} from '../../application/contexto-seguridad';
import { ActualizarConfiguracion } from '../../application/actualizar-configuracion.use-case';
import { CrearCompania } from '../../application/crear-compania.use-case';
import {
  AccesoDenegadoCompania,
  CompaniaNoEncontrada,
  SlugYaRegistrado,
} from '../../application/errores-aplicacion';
import { ObtenerCompania } from '../../application/obtener-compania.use-case';
import { DesactivarCompania } from '../../application/desactivar-compania.use-case';
import { Compania } from '../../domain/compania.entity';
import { CompanyGuard } from '../../infrastructure/company-context';
import { SuperAdminGuard } from '../../infrastructure/super-admin.guard';
import {
  ActualizarConfiguracionDto,
  CompaniaResponseDto,
  CrearCompaniaDto,
} from './dto';

type ContextoRequest = Request & { contexto?: ContextoSeguridad };

function contextoDe(peticion: ContextoRequest): ContextoSeguridad {
  if (!peticion.contexto) {
    throw new ForbiddenException('No se pudo identificar al solicitante');
  }
  return peticion.contexto;
}

function aRespuesta(compania: Compania): CompaniaResponseDto {
  return {
    id: compania.id,
    nombre: compania.nombre,
    slug: compania.slug,
    administradorId: compania.administradorId,
    activa: compania.estaActiva,
    configuracion: compania.configuracionActual,
    creadaEn: compania.creadaEn,
  };
}

function traducirError(error: unknown): never {
  if (error instanceof CompaniaNoEncontrada) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof AccesoDenegadoCompania) {
    throw new ForbiddenException(error.message);
  }
  if (error instanceof SlugYaRegistrado) {
    throw new ConflictException(error.message);
  }
  if (error instanceof Error && error.name === 'ErrorDominioCompania') {
    throw new BadRequestException(error.message);
  }
  throw error;
}

/** Adaptadores de entrada REST del módulo companies (RF-38, RF-39, RF-40). */
@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly crear: CrearCompania,
    private readonly desactivarCaso: DesactivarCompania,
    private readonly actualizar: ActualizarConfiguracion,
    private readonly obtener: ObtenerCompania,
  ) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Da de alta una compañía con su administrador (RF-38)',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido' })
  @ApiForbiddenResponse({
    description: 'Se requiere rol de superadministrador',
  })
  async crearCompania(
    @Body() datos: CrearCompaniaDto,
  ): Promise<CompaniaResponseDto> {
    try {
      const compania = await this.crear.ejecutar({
        nombre: datos.nombre,
        slug: datos.slug,
        administradorId: datos.administradorId,
        configuracion: datos.configuracion,
      });
      return aRespuesta(compania);
    } catch (error) {
      return traducirError(error);
    }
  }

  @Patch(':id/desactivar')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Desactiva una compañía (RF-38)' })
  @ApiNotFoundResponse({ description: 'Compañía no encontrada' })
  async desactivarCompania(
    @Param('id') id: string,
  ): Promise<CompaniaResponseDto> {
    try {
      return aRespuesta(await this.desactivarCaso.ejecutar(id));
    } catch (error) {
      return traducirError(error);
    }
  }

  @Get(':id')
  @UseGuards(CompanyGuard)
  @ApiOperation({
    summary: 'Consulta una compañía; superadmin o la propia compañía (RF-40)',
  })
  @ApiForbiddenResponse({
    description: 'La compañía del token no coincide con la solicitada',
  })
  async obtenerCompania(
    @Param('id') id: string,
    @Req() peticion: ContextoRequest,
  ): Promise<CompaniaResponseDto> {
    try {
      return aRespuesta(await this.obtener.ejecutar(id, contextoDe(peticion)));
    } catch (error) {
      return traducirError(error);
    }
  }

  @Patch(':id/configuracion')
  @UseGuards(CompanyGuard)
  @ApiOperation({
    summary: 'Actualiza tarifas, políticas y marca propias (RF-39, RF-40)',
  })
  @ApiForbiddenResponse({
    description: 'No es el administrador de esa compañía',
  })
  async actualizarConfiguracion(
    @Param('id') id: string,
    @Body() datos: ActualizarConfiguracionDto,
    @Req() peticion: ContextoRequest,
  ): Promise<CompaniaResponseDto> {
    const contexto = contextoDe(peticion);
    if (contexto.rol !== 'superadministrador' && !puedeAcceder(contexto, id)) {
      throw new ForbiddenException(
        'Solo el administrador de la compañía puede cambiar su configuración',
      );
    }
    try {
      return aRespuesta(
        await this.actualizar.ejecutar(id, datos.configuracion, contexto),
      );
    } catch (error) {
      return traducirError(error);
    }
  }
}
