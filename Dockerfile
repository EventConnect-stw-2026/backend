FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]