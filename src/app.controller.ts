import { Controller, Get } from '@nestjs/common';

interface RespuestaSalud {
  estado: 'ok';
  servicio: 'tosabus-api';
}

@Controller()
export class AppController {
  /** Verificación mínima de que el proceso está atendiendo peticiones. */
  @Get('health')
  salud(): RespuestaSalud {
    return { estado: 'ok', servicio: 'tosabus-api' };
  }
}
