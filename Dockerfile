FROM node:20-alpine AS builder

WORKDIR /app

# Install Bun for deterministic, bun.lockb-driven dependency installs
RUN apk add --no-cache curl \
    && curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Accept build-time environment variables from Code Engine --build-env
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

# Make them available as environment variables during build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

COPY package*.json bun.lockb ./

# Use bun install with bun.lockb for reproducible dependency installation
RUN bun install --frozen-lockfile

COPY . .

# Build the Vite application with environment variables
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
