FROM node:25-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (npm install handles lockfile drift better than ci)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the Vite application with environment variables
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
