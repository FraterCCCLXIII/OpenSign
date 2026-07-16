#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-docs.moleculepeptides.com}"
HOST_URL="${HOST_URL:-https://${DOMAIN}}"
SERVICE_NAME="${SERVICE_NAME:-opensign}"
PROJECT_NAME="${PROJECT_NAME:-Molecule-Wordpress}"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-production}"
COOLIFY_ENV_ID="${COOLIFY_ENV_ID:-3}"
COOLIFY_SERVER_ID="${COOLIFY_SERVER_ID:-0}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/opensign-coolify}"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -f "${SOURCE_DIR}/.env.prod" ]]; then
  echo "Missing ${SOURCE_DIR}/.env.prod"
  exit 1
fi

mkdir -p "${DEPLOY_DIR}"
cp "${SOURCE_DIR}/docker-compose.yml" "${SOURCE_DIR}/Caddyfile" "${SOURCE_DIR}/.env.prod" "${DEPLOY_DIR}/"
cp -R "${SOURCE_DIR}/public-sign" "${DEPLOY_DIR}/"

UUID="$(openssl rand -hex 12)"
NETWORK_NAME="opensign-${UUID}"
COMPOSE_PROJECT="opensign-${UUID}"

cat > "${DEPLOY_DIR}/.env" <<EOF
HOST_URL=${HOST_URL}
DOMAIN=${DOMAIN}
COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT}
EOF

cat > "${DEPLOY_DIR}/docker-compose.override.yml" <<EOF
services:
  mongo:
    container_name: mongo-${UUID}
    volumes:
      - ${UUID}_mongo-data:/data/db
    networks:
      ${NETWORK_NAME}: null
    labels:
      - coolify.managed=true
      - coolify.type=service
      - coolify.name=mongo-${UUID}
      - coolify.resourceName=${SERVICE_NAME}
      - coolify.projectName=${PROJECT_NAME}
      - coolify.serviceName=mongo
      - coolify.environmentName=${ENVIRONMENT_NAME}
      - coolify.service.subType=database
      - coolify.service.subName=mongo

  server:
    container_name: server-${UUID}
    volumes:
      - ${UUID}_opensign-files:/usr/src/app/files
    networks:
      ${NETWORK_NAME}: null
    labels:
      - coolify.managed=true
      - coolify.type=service
      - coolify.name=server-${UUID}
      - coolify.resourceName=${SERVICE_NAME}
      - coolify.projectName=${PROJECT_NAME}
      - coolify.serviceName=server
      - coolify.environmentName=${ENVIRONMENT_NAME}
      - coolify.service.subType=application
      - coolify.service.subName=server

  client:
    container_name: client-${UUID}
    networks:
      ${NETWORK_NAME}: null
    labels:
      - coolify.managed=true
      - coolify.type=service
      - coolify.name=client-${UUID}
      - coolify.resourceName=${SERVICE_NAME}
      - coolify.projectName=${PROJECT_NAME}
      - coolify.serviceName=client
      - coolify.environmentName=${ENVIRONMENT_NAME}
      - coolify.service.subType=application
      - coolify.service.subName=client

  public-sign:
    container_name: public-sign-${UUID}
    networks:
      ${NETWORK_NAME}: null
    labels:
      - coolify.managed=true
      - coolify.type=service
      - coolify.name=public-sign-${UUID}
      - coolify.resourceName=${SERVICE_NAME}
      - coolify.projectName=${PROJECT_NAME}
      - coolify.serviceName=public-sign
      - coolify.environmentName=${ENVIRONMENT_NAME}
      - coolify.service.subType=application
      - coolify.service.subName=public-sign

  caddy:
    container_name: caddy-${UUID}
    networks:
      ${NETWORK_NAME}: null
    labels:
      - coolify.managed=true
      - coolify.type=service
      - coolify.name=caddy-${UUID}
      - coolify.resourceName=${SERVICE_NAME}
      - coolify.projectName=${PROJECT_NAME}
      - coolify.serviceName=caddy
      - coolify.environmentName=${ENVIRONMENT_NAME}
      - coolify.service.subType=application
      - coolify.service.subName=caddy
      - traefik.enable=true
      - traefik.http.middlewares.gzip.compress=true
      - traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
      - traefik.http.routers.http-0-${UUID}-caddy.entryPoints=http
      - traefik.http.routers.http-0-${UUID}-caddy.middlewares=redirect-to-https
      - traefik.http.routers.http-0-${UUID}-caddy.rule=Host(\`${DOMAIN}\`) && PathPrefix(\`/\`)
      - traefik.http.routers.http-0-${UUID}-caddy.service=http-0-${UUID}-caddy
      - traefik.http.routers.https-0-${UUID}-caddy.entryPoints=https
      - traefik.http.routers.https-0-${UUID}-caddy.middlewares=gzip
      - traefik.http.routers.https-0-${UUID}-caddy.rule=Host(\`${DOMAIN}\`) && PathPrefix(\`/\`)
      - traefik.http.routers.https-0-${UUID}-caddy.service=https-0-${UUID}-caddy
      - traefik.http.routers.https-0-${UUID}-caddy.tls.certresolver=letsencrypt
      - traefik.http.routers.https-0-${UUID}-caddy.tls=true
      - traefik.http.services.http-0-${UUID}-caddy.loadbalancer.server.port=80
      - traefik.http.services.https-0-${UUID}-caddy.loadbalancer.server.port=80
      - caddy_0.encode=zstd gzip
      - caddy_0.handle_path.0_reverse_proxy={{upstreams 80}}
      - caddy_0.handle_path=/*
      - caddy_0.header=-Server
      - caddy_0.try_files={path} /index.html /index.php
      - caddy_0=https://${DOMAIN}
      - caddy_ingress_network=${NETWORK_NAME}

networks:
  ${NETWORK_NAME}:
    name: ${NETWORK_NAME}
    external: true

volumes:
  ${UUID}_mongo-data:
    name: ${UUID}_mongo-data
  ${UUID}_opensign-files:
    name: ${UUID}_opensign-files
EOF

docker network inspect coolify >/dev/null 2>&1 || true
docker network create "${NETWORK_NAME}" >/dev/null

cd "${DEPLOY_DIR}"
docker compose --project-name "${COMPOSE_PROJECT}" pull
docker compose --project-name "${COMPOSE_PROJECT}" build public-sign
docker compose --project-name "${COMPOSE_PROJECT}" up -d

docker network connect "${NETWORK_NAME}" coolify-proxy 2>/dev/null || true

cat > "${DEPLOY_DIR}/deployment-info.txt" <<EOF
OpenSign deployment
Domain: ${HOST_URL}
UUID: ${UUID}
Network: ${NETWORK_NAME}
Mongo volume: ${UUID}_mongo-data
Files volume: ${UUID}_opensign-files
Deploy dir: ${DEPLOY_DIR}
EOF

echo "Deployed OpenSign to ${HOST_URL}"
cat "${DEPLOY_DIR}/deployment-info.txt"
