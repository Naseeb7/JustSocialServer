
# Use the official Node.js image as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /server

# Copy the application files into the working directory
COPY . .

# Install the application dependencies
RUN npm install

# Expose port 3001
EXPOSE 3001

# Define the entry point for the container
CMD ["node", "index.js"]