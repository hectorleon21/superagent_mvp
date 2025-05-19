FROM oven/bun:1

WORKDIR /app

COPY package.json .
COPY bun.lock .
COPY src src/
COPY tsconfig.json .

RUN bun install

ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"] 