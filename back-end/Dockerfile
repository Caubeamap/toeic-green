# STAGE 1: Build NestJS application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install openssl needed for Prisma engine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript code to JS (creates dist/ directory)
RUN npm run build

# STAGE 2: Production runtime environment
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies to keep the image lightweight
RUN npm ci --omit=dev && npm cache clean --force

# Regenerate Prisma Client in the production node_modules
RUN npx prisma generate

# Copy compiled code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose backend API port
EXPOSE 2409

# Start the NestJS application
CMD ["node", "dist/src/main.js"]
