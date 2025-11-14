FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 7788/tcp

CMD ["npm", "start"]