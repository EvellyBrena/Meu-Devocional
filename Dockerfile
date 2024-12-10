FROM oven/bun

COPY package.json bun.lockb prisma/schema.prisma ./

RUN bun install

COPY . .

CMD ["bun", "start"]
