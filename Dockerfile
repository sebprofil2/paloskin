# paloskin.de: Next.js im Standalone-Modus für den Hetzner-Server (HTTPS über Caddy davor, deploy/docker-compose.yml).
# Umgebungsvariablen zur Laufzeit setzen.
# Grundlage über Googles Spiegel von Docker Hub (mirror.gcr.io, dasselbe offizielle Image): Am 9. Oktober 2026 scheiterte der
# Bau dreimal, weil Docker Hub dem Bau-Rechner von GitHub nicht antwortete.
FROM mirror.gcr.io/library/node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM mirror.gcr.io/library/node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM mirror.gcr.io/library/node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 10001 -S app && adduser -u 10001 -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
