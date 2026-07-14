FROM node:20-bookworm

WORKDIR /server

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 4000

CMD ["npm", "start"]