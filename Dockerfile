# Panel: production image built from Next.js standalone output.
#   docker build -t panel .
#   docker run --rm -p 3000:3000 --env-file .env.local panel
# Keys are passed at run time, never baked into the image.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S panel && adduser -S panel -G panel
COPY --from=build --chown=panel:panel /app/.next/standalone ./
COPY --from=build --chown=panel:panel /app/.next/static ./.next/static
COPY --from=build --chown=panel:panel /app/public ./public
USER panel
EXPOSE 3000
CMD ["node", "server.js"]
