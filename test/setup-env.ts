// Valores ficticios y exclusivos de pruebas: nunca credenciales reales.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-de-prueba-con-longitud-suficiente-123456';
process.env.DATABASE_URL = 'postgresql://tosabus:tosabus@127.0.0.1:5432/tosabus';
