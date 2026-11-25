import * as Joi from 'joi';

/**
 * Valores de ejemplo para desarrollo local. En producción deben definirse
 * variables reales (en particular JWT_SECRET) mediante variables de entorno.
 */
export const esquemaVariablesEntorno = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .default('postgresql://tosabus:tosabus@localhost:5432/tosabus'),
  POSTGRES_DB: Joi.string().min(1).default('tosabus'),
  POSTGRES_USER: Joi.string().min(1).default('tosabus'),
  POSTGRES_PASSWORD: Joi.string().min(1).default('tosabus'),
  POSTGRES_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  JWT_SECRET: Joi.string().min(16).required(),
}).unknown(true);

export function validarVariablesEntorno(
  configuracion: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = esquemaVariablesEntorno.validate(configuracion, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    throw new Error(`Variables de entorno inválidas: ${error.message}`);
  }

  return value;
}
