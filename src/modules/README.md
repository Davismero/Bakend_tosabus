# Módulos del backend

El backend es un **monolito modular** con arquitectura limpia y hexagonal, y DDD
ligero. Esta carpeta contendrá un subdirectorio por cada módulo de negocio. En
T-01 solo se crea esta guía: los módulos se añaden en sus tareas respectivas
(no se dejan carpetas vacías).

## Capas de cada módulo

```
modules/<modulo>/
├── domain/                 # Entidades y reglas de negocio (sin NestJS, ORM ni SDKs)
├── use-cases/              # Casos de uso: orquestan las reglas del dominio
├── adapters/
│   ├── in/                 # Adaptadores de entrada: controladores REST y WebSocket
│   └── out/                # Adaptadores de salida: base de datos, pagos, mapas, FCM
└── <modulo>.module.ts      # Cableado de dependencias del módulo
```

- Las dependencias apuntan **hacia el dominio**. El dominio no importa NestJS,
  el ORM ni ningún SDK externo.
- Un módulo no accede a las tablas de otro: se comunica mediante sus casos de
  uso o interfaces públicas.
- Los servicios externos (pasarela de pagos, mapas, FCM) se usan solo a través
  de **puertos** con su adaptador.
- Lenguaje ubicuo: Compañía, Ruta, Parada, Bus, Viaje, Reserva, Boleto, Pago,
  Ubicación. Nombres y textos de usuario en español.
- Toda regla de negocio y caso de uso lleva pruebas unitarias sin depender de
  internet ni de servicios reales.

## Módulos previstos

| Módulo | Responsabilidad |
|---|---|
| `auth` | Autenticación JWT, roles y permisos |
| `companies` | Compañías y aislamiento por compañía (RF-40) |
| `routes` | Rutas, paradas, horarios y tarifas |
| `fleet` | Buses y conductores |
| `trips` | Programación y ejecución de viajes |
| `bookings` | Reservas, boletos y validación de QR |
| `payments` | Pagos detrás de un puerto/adaptador en modo de pruebas |
| `tracking` | Ubicación en vivo y WebSocket |
| `notifications` | Notificaciones push (FCM) y avisos |
| `reports` | Reportes de ventas y ocupación |
