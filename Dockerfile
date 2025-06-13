# Stage 1: Build
# Use an official Node.js 18 image as a base.
FROM node:18-slim AS build

# Set the working directory in the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker's build cache.
COPY package*.json ./

# Install dependencies. This includes the static binaries for ffmpeg and yt-dlp.
# We use 'npm ci' for faster, more reliable builds in CI/CD environments.
RUN npm ci --production

# Copy the rest of your application's source code.
COPY . .

# Stage 2: Production
# Use a clean, minimal Node.js image for the final production environment.
FROM node:18-slim AS production

# Set the working directory.
WORKDIR /usr/src/app

# Copy the installed dependencies and source code from the build stage.
COPY --from=build /usr/src/app/ .

# Expose the port your app will run on. Render will use its own PORT env variable.
EXPOSE 3003

# The command to run your application.
CMD ["node", "server.js"]