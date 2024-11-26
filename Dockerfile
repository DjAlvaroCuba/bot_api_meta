# Image size ~ 400MB
FROM node:21 as builder

WORKDIR /app

# Habilitar corepack y preparar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

# Copiar los archivos de tu proyecto
COPY . .

# Copiar los archivos de configuración
COPY package*.json *-lock.yaml ./

# Instalar dependencias necesarias para compilar y construir
RUN apt-get update && apt-get install -y \
        python3 \
        make \
        g++ \
        git \
    && pnpm install && pnpm run build \
    && apt-get clean

# Etapa de despliegue
FROM node:21 as deploy

WORKDIR /app

# Configuración de Node.js para usar OpenSSL legacy
ENV NODE_OPTIONS=--openssl-legacy-provider

ARG PORT
ENV PORT $PORT
EXPOSE $PORT

# Copiar los archivos generados desde la etapa de construcción
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/*.json /app/*-lock.yaml ./

# Habilitar corepack y preparar pnpm en la etapa de despliegue
RUN corepack enable && corepack prepare pnpm@latest --activate 
ENV PNPM_HOME=/usr/local/bin

# Instalar solo las dependencias de producción
RUN npm cache clean --force && pnpm install --production --ignore-scripts \
    && addgroup -g 1001 -S nodejs && adduser -S -u 1001 nodejs \
    && rm -rf $PNPM_HOME/.npm $PNPM_HOME/.node-gyp

CMD ["npm", "start"]
