FROM node:20-alpine

WORKDIR /app
COPY worker.mjs ./worker.mjs

USER node
CMD ["node", "worker.mjs"]