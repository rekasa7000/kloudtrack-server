FROM node:22

WORKDIR /dist

COPY package*.json ./

RUN NPM INSTALL

COPY . .

