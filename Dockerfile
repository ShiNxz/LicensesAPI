# syntax=docker/dockerfile:1
#
# Licenses API: Hono on Bun, run from source (index.ts).
#
# Easypanel (licenses): source GitHub, Build Path `/`, build type Dockerfile,
# file `Dockerfile`, no build or start command. Locally: docker build .
#
# Runtime env (MONGODB_*, PAYPAL_*, HOST, PORT, ...) comes from Easypanel, never
# from the image: this file declares no build args, so none of it gets baked in.

FROM oven/bun:1.4.4-slim
WORKDIR /app
# The postinstall (bunx custompatch) applies patches/ to node_modules, so the
# patches come in with the manifests, before the install.
COPY package.json bun.lockb ./
COPY patches ./patches
RUN --mount=type=cache,target=/root/.bun/install/cache,sharing=locked bun install --frozen-lockfile
COPY . .
# Nothing is written to disk (MongoDB holds the state), so it runs as `bun`.
ENV NODE_ENV=production
USER bun
# PORT, 3000 unless set.
EXPOSE 3000
STOPSIGNAL SIGTERM
CMD ["bun", "."]
