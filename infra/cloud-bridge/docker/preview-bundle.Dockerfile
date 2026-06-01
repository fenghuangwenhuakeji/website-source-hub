FROM node:18-bullseye AS builder

WORKDIR /workspace

COPY packages/shared /workspace/packages/shared

COPY apps/website/package.json /workspace/apps/website/package.json
COPY apps/website/package-lock.json /workspace/apps/website/package-lock.json
COPY apps/client-web/package.json /workspace/apps/client-web/package.json
COPY apps/client-web/package-lock.json /workspace/apps/client-web/package-lock.json
COPY apps/backend/package.json /workspace/apps/backend/package.json
COPY apps/backend/package-lock.json /workspace/apps/backend/package-lock.json

RUN npm --prefix apps/website ci
RUN npm --prefix apps/client-web ci
RUN npm --prefix apps/backend ci

COPY apps/website /workspace/apps/website
COPY apps/client-web /workspace/apps/client-web
COPY apps/backend /workspace/apps/backend

RUN npm --prefix apps/website run build
RUN npm --prefix apps/client-web run build
RUN npm --prefix apps/backend run build
RUN npm --prefix apps/backend prune --omit=dev

RUN mkdir -p /out/release /out/release/access /out/source/apps/backend /out/source/apps/website /out/source/apps/client-web

RUN cp -a /workspace/apps/website/dist/. /out/release/
RUN cp -a /workspace/apps/client-web/dist/. /out/release/access/

RUN cp -a /workspace/apps/backend/dist /out/source/apps/backend/dist
RUN cp -a /workspace/apps/backend/node_modules /out/source/apps/backend/node_modules
RUN cp /workspace/apps/backend/package.json /out/source/apps/backend/package.json
RUN cp /workspace/apps/backend/package-lock.json /out/source/apps/backend/package-lock.json
RUN cp /workspace/apps/backend/.env.example /out/source/apps/backend/.env.example

RUN if [ -d /workspace/apps/backend/migrations ]; then cp -a /workspace/apps/backend/migrations /out/source/apps/backend/migrations; fi
RUN if [ -d /workspace/apps/backend/scripts ]; then cp -a /workspace/apps/backend/scripts /out/source/apps/backend/scripts; fi

RUN cp -a /workspace/apps/website/dist /out/source/apps/website/dist
RUN cp /workspace/apps/website/package.json /out/source/apps/website/package.json
RUN cp /workspace/apps/website/package-lock.json /out/source/apps/website/package-lock.json

RUN cp -a /workspace/apps/client-web/dist /out/source/apps/client-web/dist
RUN cp /workspace/apps/client-web/package.json /out/source/apps/client-web/package.json
RUN cp /workspace/apps/client-web/package-lock.json /out/source/apps/client-web/package-lock.json
