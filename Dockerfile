FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app files
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose port (Railway will provide this)
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Start the bot
CMD ["node", "bot.js"] 