FROM node:20-alpine

COPY package.json package-lock.json ./

RUN npm install

COPY . .

CMD ["npm", "run", "start"]
