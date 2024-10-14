# Description: Dockerfile for the Node.js application
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json .

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Serve the app
CMD ["npm", "run", "dev"]