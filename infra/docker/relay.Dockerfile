FROM node:22-alpine

WORKDIR /workspace
ENV NODE_ENV=production

COPY . .
RUN npm install
RUN npm run build --workspace @pocketcoder/protocol
RUN npm run build --workspace @pocketcoder/relay

EXPOSE 8080
CMD ["node", "apps/relay/dist/server.js"]