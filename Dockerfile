FROM node:20-alpine AS builder

WORKDIR /app

# Accept build-time environment variables from Code Engine --build-env
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

# Make them available as environment variables during build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies using npm (more reliable in Docker alpine)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the Vite application with environment variables
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
