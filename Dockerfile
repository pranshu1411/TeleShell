FROM oven/bun:1-slim AS base
WORKDIR /app

# Install some useful utilities so the AI agent has tools to work with
RUN apt-get update && \
    apt-get install -y git curl wget jq python3 nano vim && \
    rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Ensure the entrypoint script is executable
RUN chmod +x index.ts

# Default command runs the CLI interactive menu
CMD ["bun", "run", "index.ts", "wakeup"]
