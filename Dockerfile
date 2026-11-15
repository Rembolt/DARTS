# DARTS: one image that serves the page, the API and the Matterport Bundle. See docs/project/deployment-plan.md.
FROM node:24-slim

WORKDIR /srv

# Dependencies first, so a code-only change reuses this layer.
COPY package.json package-lock.json ./
COPY app/package.json app/
COPY server/package.json server/
RUN npm ci

COPY . .

# The Bundle (28 MB) is never in git; it is downloaded at build time. Then the page is built into app/dist.
RUN npm run fetch-bundle && npm run build

ENV HOST=0.0.0.0 \
    PORT=8080 \
    NODE_ENV=production
EXPOSE 8080

# node directly (not npm), so the stop signal reaches the server.
CMD ["node", "--import", "tsx", "server/src/index.ts"]
