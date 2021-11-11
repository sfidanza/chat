FROM node:current-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run lint

CMD [ "npm", "start" ]