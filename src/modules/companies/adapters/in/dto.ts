import { ApiProperty } from '@nestjs/swagger';
import {
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TarifaBaseDto {
  @ApiProperty({
    description: 'Importe en centavos (entero positivo)',
    example: 250,
  })
  @IsInt()
  @IsPositive()
  centavos!: number;

  @ApiProperty({ description: 'Moneda ISO 4217', example: 'USD' })
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  moneda!: string;
}

class PoliticasDto {
  @ApiProperty({
    description: 'Días de anticipación para reservar',
    example: 30,
  })
  @IsInt()
  @Min(0)
  diasAnticipacion!: number;

  @ApiProperty({
    description: 'Minutos antes de la salida con cancelación gratis',
    example: 60,
  })
  @IsInt()
  @Min(0)
  minutosCancelacionGratis!: number;

  @ApiProperty({ description: 'Texto de la política, en español' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  texto!: string;
}

class MarcaDto {
  @ApiProperty({
    description: 'Nombre comercial',
    example: 'Transportes Tosagua',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombreComercial!: string;

  @ApiProperty({
    description: 'Color principal hexadecimal',
    example: '#1F7A33',
  })
  @IsHexColor()
  colorPrimario!: string;

  @ApiProperty({
    description: 'URL del logo, o null si no hay',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  logoUrl!: string | null;
}

export class ConfiguracionDto {
  @ApiProperty({ type: TarifaBaseDto })
  @ValidateNested()
  @Type(() => TarifaBaseDto)
  tarifaBase!: TarifaBaseDto;

  @ApiProperty({ type: PoliticasDto })
  @ValidateNested()
  @Type(() => PoliticasDto)
  politicas!: PoliticasDto;

  @ApiProperty({ type: MarcaDto })
  @ValidateNested()
  @Type(() => MarcaDto)
  marca!: MarcaDto;
}

export class CrearCompaniaDto {
  @ApiProperty({
    description: 'Nombre de la compañía',
    example: 'Cooperativa Tosagua',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @ApiProperty({
    description: 'Identificador único (slug)',
    example: 'cooperativa-tosagua',
  })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @ApiProperty({
    description: 'Identificador del administrador (T-04 creará el usuario)',
  })
  @IsString()
  @IsNotEmpty()
  administradorId!: string;

  @ApiProperty({ type: ConfiguracionDto })
  @ValidateNested()
  @Type(() => ConfiguracionDto)
  configuracion!: ConfiguracionDto;
}

export class ActualizarConfiguracionDto {
  @ApiProperty({ type: ConfiguracionDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ConfiguracionDto)
  configuracion!: ConfiguracionDto;
}

export class CompaniaResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nombre!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  administradorId!: string;

  @ApiProperty()
  activa!: boolean;

  @ApiProperty({ type: ConfiguracionDto })
  configuracion!: ConfiguracionDto;

  @ApiProperty()
  creadaEn!: Date;
}
