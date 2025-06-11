# Use an official Node.js 18 image as a base
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install dependencies: wget to download, python3 to run, and ffmpeg
# We no longer need pip3
RUN apt-get update && apt-get install -y wget python3 ffmpeg

# --- THIS IS THE NEW, MORE RELIABLE METHOD ---
# Use wget to download the latest yt-dlp binary directly into a system path
# Then, make it executable for everyone
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Copy your package.json and package-lock.json
COPY package*.json ./

# Install your app's Node.js dependencies
RUN npm install --production

# Copy the rest of your application code into the container
COPY . .

# Tell the world that the container will listen on the port Render provides
EXPOSE 10000

# The command to run when the container starts
CMD [ "node", "server.js" ]