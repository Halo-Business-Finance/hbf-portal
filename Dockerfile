FROM node:25-alpine AS builder

WORKDIR /app

# Install Bun for deterministic, bun.lockb-driven dependency installs
RUN apk add --no-cache curl \
    && curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Code Engine passes build-time environment variables via --build-env
# These are automatically available as ENV during build
# No ARG declarations needed - the vars come from the build environment

COPY package*.json ./

# Use bun install with bun.lockb for reproducible dependency installation
RUN bun install

COPY . .

# VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are passed via --build-env
# and are available as environment variables during build
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
