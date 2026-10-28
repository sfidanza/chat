FROM node:26-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN node --run lint

CMD [ "node", "--run", "start" ]