FROM node:22-bookworm-slim
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --include=dev
COPY apps/web ./apps/web
RUN npm run build
RUN chown -R node:node /workspace/apps/web/.next
USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@amanah/web"]
