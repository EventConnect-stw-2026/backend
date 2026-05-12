# Aplicación: EventConnect - Plataforma de gestión de eventos
# Archivo: Dockerfile
# Descripción: Imagen Docker para el backend de EventConnect.
# Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]