FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (caching layer)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
