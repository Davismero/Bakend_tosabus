/**
 * Identidad del solicitante, extraída del JWT en el servidor.
 * Nunca se toma del cuerpo, la consulta ni los parámetros de la petición.
 */
export interface ContextoSeguridad {
  companyId: string;
  rol: 'pasajero' | 'conductor' | 'administrador' | 'superadministrador';
}

/** El superadministrador puede operar sobre cualquier compañía. */
export function puedeAcceder(
  contexto: ContextoSeguridad,
  companiaId: string,
): boolean {
  return (
    contexto.rol === 'superadministrador' || contexto.companyId === companiaId
  );
}
