# Use an official Node.js 18 image as a base
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install Python, pip, and ffmpeg using the Linux package manager
# yt-dlp needs Python to run
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg

# Use pip to install the latest version of yt-dlp
RUN pip3 install -U yt-dlp

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