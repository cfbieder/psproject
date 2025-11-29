FROM node:20-alpine

WORKDIR /app

COPY components/package*.json ./components/
COPY server/package*.json ./server/
RUN npm ci --omit=dev --prefix components \
 && npm ci --omit=dev --prefix server

COPY components ./components
COPY server ./server

ENV NODE_ENV=production \
    PORT=3005 \
    MONGO_URI=mongodb://mongo:27018/fin

WORKDIR /app/server
EXPOSE 3005
CMD ["npm", "run", "dok"]
