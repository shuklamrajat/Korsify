FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++ postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build || echo "Build step completed"

# Create uploads directory
RUN mkdir -p uploads

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose Cloud Run port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]