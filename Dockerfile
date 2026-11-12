# Production Dockerfile for Google Cloud Run
FROM node:22-slim

WORKDIR /app

# Copy package manifests first for layer caching
COPY package*.json ./

# Install dependencies (including build tooling needed for vite build)
RUN npm install

# Copy application source
COPY . .

# Build the production React + Tailwind frontend into /app/dist
RUN npm run build

# Configure production environment defaults for Cloud Run
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the Express + Gemini backend and static frontend server
CMD ["npm", "start"]
