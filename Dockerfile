# ---------- build ----------
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---------- runtime ----------
FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY --from=build /app/build ./build
COPY --from=build /app/drizzle ./drizzle

ENV HOST=127.0.0.1 ORIGIN=http://127.0.0.1:3000
EXPOSE 3000
VOLUME /app/data

CMD ["bun", "./build"]
