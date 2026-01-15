FROM node:20-alpine AS builder

WORKDIR /app

# Code Engine passes build-time environment variables via --build-env
# These are automatically available as ENV during build
# No ARG declarations needed - the vars come from the build environment

COPY package*.json ./

# Use npm install instead of npm ci (project uses bun.lockb, not package-lock.json)
RUN npm install

COPY . .

# VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are passed via --build-env
# and are available as environment variables during build
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
