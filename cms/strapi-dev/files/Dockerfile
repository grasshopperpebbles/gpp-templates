FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache \
    curl \
    bash

# Set working directory
WORKDIR /opt/app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm install since package-lock.json may not exist yet
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 1337

# Start Strapi
CMD ["npm", "run", "develop"]

