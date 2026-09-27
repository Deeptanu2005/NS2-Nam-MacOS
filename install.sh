#!/bin/bash

set -e

REPO_URL="https://github.com/Deeptanu2005/NS2-Nam-MacOS.git"
INSTALL_DIR="$HOME/NS2Nam"
IMAGE_NAME="ns2-nam:latest"

RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
RESET='\033[0m'

info() {
    printf "${CYAN}%s${RESET}\n" "$1"
}

success() {
    printf "${GREEN}%s${RESET}\n" "$1"
}

warning() {
    printf "${YELLOW}%s${RESET}\n" "$1"
}

error() {
    printf "${RED}%s${RESET}\n" "$1" >&2
}

printf "\n"
printf "${CYAN}========================================${RESET}\n"
printf "${CYAN} NS2Nam - macOS Installer${RESET}\n"
printf "${CYAN}========================================${RESET}\n\n"

# ------------------------------------------------------------
# Check operating system
# ------------------------------------------------------------

if [ "$(uname -s)" != "Darwin" ]; then
    error "This installer is intended for macOS."
    exit 1
fi

# ------------------------------------------------------------
# Check Docker
# ------------------------------------------------------------

if ! command -v docker >/dev/null 2>&1; then
    error "Docker is not installed."
    echo "Install Docker Desktop for Mac and run this installer again."
    exit 1
fi

success "Docker found."

# ------------------------------------------------------------
# Check Docker Desktop
# ------------------------------------------------------------

if ! docker info >/dev/null 2>&1; then
    error "Docker Desktop is not running."
    echo "Start Docker Desktop and run this installer again."
    exit 1
fi

success "Docker Desktop is running."

# ------------------------------------------------------------
# Check XQuartz
# ------------------------------------------------------------

if ! command -v xquartz >/dev/null 2>&1 && \
   [ ! -d "/Applications/Utilities/XQuartz.app" ] && \
   [ ! -d "/Applications/XQuartz.app" ]; then

    error "XQuartz is not installed."
    echo "Install XQuartz and run this installer again."
    exit 1
fi

success "XQuartz found."

# ------------------------------------------------------------
# Create / update project directory
# ------------------------------------------------------------

if [ -d "$INSTALL_DIR/.git" ]; then

    info "Existing NS2Nam installation detected."

    cd "$INSTALL_DIR"

    git pull --ff-only

else

    if [ -d "$INSTALL_DIR" ]; then
        warning "$INSTALL_DIR already exists but is not a Git repository."

        if [ -d "$INSTALL_DIR/simulations" ]; then
            warning "Existing simulations will be preserved."
        fi

    else
        info "Downloading NS2Nam..."
        git clone "$REPO_URL" "$INSTALL_DIR"
    fi

fi

cd "$INSTALL_DIR"

mkdir -p simulations examples bin

# ------------------------------------------------------------
# Configure XQuartz
# ------------------------------------------------------------

info "Configuring XQuartz..."

defaults write org.xquartz.X11 nolisten_tcp -bool false

# ------------------------------------------------------------
# Start XQuartz
# ------------------------------------------------------------

if ! pgrep -x XQuartz >/dev/null 2>&1 && \
   ! pgrep -x X11.bin >/dev/null 2>&1; then

    info "Starting XQuartz..."
    open -a XQuartz
    sleep 3
fi

# ------------------------------------------------------------
# Allow local X11 clients
# ------------------------------------------------------------

if command -v xhost >/dev/null 2>&1; then
    xhost +localhost >/dev/null 2>&1 || true
fi

# ------------------------------------------------------------
# Build Docker image
# ------------------------------------------------------------

info "Building NS2Nam Docker image..."

docker build \
    --platform linux/amd64 \
    -t "$IMAGE_NAME" \
    "$INSTALL_DIR"

success "Docker image built."

# ------------------------------------------------------------
# Install global command
# ------------------------------------------------------------

mkdir -p "$HOME/.local/bin"

cp "$INSTALL_DIR/bin/ns2" "$HOME/.local/bin/ns2"
chmod +x "$HOME/.local/bin/ns2"

# ------------------------------------------------------------
# Configure PATH
# ------------------------------------------------------------

add_path_to_shell() {
    local rc_file="$1"

    if [ -f "$rc_file" ] && ! grep -Fq 'export PATH="$HOME/.local/bin:$PATH"' "$rc_file"; then
        printf '\n# NS2Nam\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$rc_file"
    fi
}

add_path_to_shell "$HOME/.zshrc"
add_path_to_shell "$HOME/.bashrc"

export PATH="$HOME/.local/bin:$PATH"

# ------------------------------------------------------------
# Verify installation
# ------------------------------------------------------------

if ! command -v ns2 >/dev/null 2>&1; then
    error "The ns2 command could not be added to the current PATH."
    echo
    echo "Restart your terminal and run:"
    echo
    echo "    ns2"
    exit 1
fi

# ------------------------------------------------------------
# Verify Docker environment
# ------------------------------------------------------------

info "Verifying NS-2 environment..."

docker run --rm \
    --platform linux/amd64 \
    "$IMAGE_NAME" \
    sh -c 'which ns && which nam && which tclsh' >/dev/null

success "NS-2, NAM and Tcl verified."

# ------------------------------------------------------------
# Installation complete
# ------------------------------------------------------------

printf "\n"
printf "${GREEN}========================================${RESET}\n"
printf "${GREEN} Installation complete${RESET}\n"
printf "${GREEN}========================================${RESET}\n\n"

echo "Installation directory:"
echo "  $INSTALL_DIR"
echo
echo "Global command:"
echo "  ns2"
echo
echo "Simulation directory:"
echo "  $INSTALL_DIR/simulations"
echo
echo "Test installation:"
echo
echo "  ns2"
echo
echo "Then inside the container:"
echo
echo "  ns send_receive.tcl"
echo
