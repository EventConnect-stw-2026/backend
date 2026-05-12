Aplicación: EventConnect - Plataforma de gestión de eventos
Archivo: DAPI.md
Descripción: 
Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel

# API de EventConnect (backend-stw)

Este documento describe la API RESTful del backend de EventConnect, una plataforma para la gestión de eventos, usuarios, chats y amigos.

## Autenticación
- **Registro**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **Logout**: `POST /api/auth/logout`
- **Renovar Token**: `POST /api/auth/refresh`

## Usuarios
- **Obtener perfil**: `GET /api/users/:id`
- **Actualizar perfil**: `PUT /api/users/:id`
- **Eliminar usuario**: `DELETE /api/users/:id`

## Amigos
- **Enviar solicitud de amistad**: `POST /api/friends/request/:userId`
- **Aceptar solicitud**: `POST /api/friends/accept/:requestId`
- **Rechazar solicitud**: `POST /api/friends/reject/:requestId`
- **Eliminar amigo**: `DELETE /api/friends/:friendId`
- **Listar amigos**: `GET /api/friends/list`

## Eventos
- **Listar eventos**: `GET /api/events`
- **Crear evento**: `POST /api/events`
- **Obtener evento**: `GET /api/events/:id`
- **Actualizar evento**: `PUT /api/events/:id`
- **Eliminar evento**: `DELETE /api/events/:id`
- **Unirse a evento**: `POST /api/events/:id/join`
- **Salir de evento**: `POST /api/events/:id/leave`

## Chat
- **Listar conversaciones**: `GET /api/chat/conversations`
- **Obtener mensajes**: `GET /api/chat/:conversationId/messages`
- **Enviar mensaje**: `POST /api/chat/:conversationId/messages`

## Administración (Admin)
- **Listar usuarios**: `GET /api/admin/users`
- **Bloquear usuario**: `POST /api/admin/users/:id/block`
- **Desbloquear usuario**: `POST /api/admin/users/:id/unblock`
- **Eliminar usuario**: `DELETE /api/admin/users/:id`

## Sincronización de eventos externos (Zaragoza)
- **Importar eventos Zaragoza**: `POST /api/zaragoza/import`
- **Listar eventos Zaragoza**: `GET /api/zaragoza/events`

---

## Notas
- Todas las rutas pueden requerir autenticación mediante JWT.
- Los endpoints de administración requieren permisos de administrador.
- Los datos de conexión a la base de datos y otros secretos se configuran en el archivo `.env`.

## Estructura de carpetas relevante
- `src/routes/` — Definición de rutas de la API
- `src/controllers/` — Lógica de negocio de cada recurso
- `src/models/` — Modelos de datos (Mongoose)
- `src/middlewares/` — Middlewares de autenticación, validación, etc.

---

Para más detalles sobre los parámetros y respuestas de cada endpoint, consulta los controladores en `src/controllers/`.
