FROM node:18-alpine

# Install PostgreSQL client and build tools
RUN apk add --no-cache postgresql-client python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create necessary directories
RUN mkdir -p uploads

# Cloud Run expects port 8080
ENV PORT=8080
EXPOSE 8080

# Start the application
CMD ["npm", "start"]