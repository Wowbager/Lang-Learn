# syntax=docker/dockerfile:1.7

########## BUILD ##########
FROM node:20-alpine AS build
WORKDIR /app

# Install deps with cache
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Source
COPY . .

# Build-time args (CRA-style)
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_DOMAIN

# Bake them in
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_WS_URL=${REACT_APP_WS_URL}
ENV REACT_APP_DOMAIN=${REACT_APP_DOMAIN}

# CRA outputs to /build
RUN npm run build

########## RUNTIME ##########
FROM nginx:1.27-alpine

# Minimal SPA config (fallback to /index.html)
RUN <<'EOF' sh -eu
cat >/etc/nginx/conf.d/default.conf <<'NGINX'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;

  # No cache anywhere (good for debugging)
  location / {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    try_files $uri /index.html;
  }
}

NGINX
EOF

# Copy build output
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
