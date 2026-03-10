FROM node:22-bookworm-slim

ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Install base dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    unzip \
    wget \
    jq \
    less \
    zsh \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages as root
RUN npm install -g \
    serverless@3 \
    serverless-offline \
    typescript \
    ts-node \
    nodemon

# Install Oh My Zsh for node user
USER $USERNAME
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Install Claude Code
RUN curl -fsSL https://claude.ai/install.sh | bash

# Configure PATH
RUN echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc \
    && echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

# Command history persistence
RUN echo "export HISTFILE=/commandhistory/.zsh_history" >> ~/.zshrc

USER root
RUN mkdir -p /commandhistory && chown $USERNAME /commandhistory

USER $USERNAME
WORKDIR /workspaces
