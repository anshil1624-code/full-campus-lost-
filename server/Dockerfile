FROM node:20-alpine

WORKDIR /app

# Install native dependencies for build
RUN apk add --no-cache python3 make g++

# Copy package definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Ensure database and uploads directories exist
RUN mkdir -p /app/database /app/uploads

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production
ENV DATABASE_MODE=sqlite
ENV DB_FILE_PATH=/app/database/lost_and_found.sqlite

CMD ["node", "server.js"]
