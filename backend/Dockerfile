FROM node:20-slim

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace root and backend package files
COPY package.json ./
COPY backend/package.json ./backend/

# Install dependencies
RUN npm install --workspace=backend --ignore-scripts

# Copy Prisma schema and generate client
COPY backend/prisma ./backend/prisma
RUN npx prisma generate --schema=./backend/prisma/schema.prisma

# Copy source
COPY backend/src ./backend/src

EXPOSE 4000

CMD ["node", "backend/src/index.js"]
