FROM node:20-alpine

COPY package.json package-lock.json prisma/schema.prisma ./

RUN npm install

COPY . .

CMD ["npm", "run", "start"]
