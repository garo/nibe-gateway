FROM node:11

ADD . /app
WORKDIR /app
RUN npm install

CMD ["node", "main.js"]
