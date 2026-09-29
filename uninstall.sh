#!/bin/bash

set -e

INSTALL_DIR="$HOME/NS2Nam"
IMAGE_NAME="ns2-nam:latest"
GLOBAL_CMD="$HOME/.local/bin/ns2"

RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
RESET='\033[0m'

printf "\n"
printf "${RED}============================================================${RESET}\n"
printf "${RED}                 WARNING: NS2Nam UNINSTALL${RESET}\n"
printf "${RED}============================================================${RESET}\n"
printf "\n"

printf "${RED}The following NS2Nam components will be removed:${RESET}\n"
printf "${RED}  - NS2Nam Docker image${RESET}\n"
printf "${RED}  - Containers created from the NS2Nam image${RESET}\n"
printf "${RED}  - Global 'ns2' command${RESET}\n"
printf "${RED}  - NS2Nam project files${RESET}\n"
printf "${RED}  - XQuartz localhost access grant${RESET}\n"
printf "\n"

printf "${GREEN}The following will NOT be removed:${RESET}\n"
printf "  ${GREEN}~/NS2Nam/simulations/${RESET}\n"
printf "  ${GREEN}Your simulation files${RESET}\n"
printf "  ${GREEN}Other Docker images${RESET}\n"
printf "  ${GREEN}Other Docker containers${RESET}\n"
printf "  ${GREEN}Other Docker volumes${RESET}\n"
printf "  ${GREEN}Docker Desktop data${RESET}\n"
printf "\n"

printf "${YELLOW}This operation cannot be automatically undone.${RESET}\n"
printf "\n"

printf "Type ${RED}UNINSTALL${RESET} to continue: "
read -r CONFIRMATION

if [ "$CONFIRMATION" != "UNINSTALL" ]; then
    printf "\n${GREEN}Uninstallation cancelled.${RESET}\n\n"
    exit 0
fi

printf "\n"
printf "${CYAN}Starting NS2Nam uninstallation...${RESET}\n\n"

# Revoke the localhost X11 access grant enabled by the installer and launcher.
if command -v xhost >/dev/null 2>&1; then
    xhost -localhost >/dev/null 2>&1 || true
fi

# ------------------------------------------------------------
# Remove NS2Nam Docker resources
# ------------------------------------------------------------

if command -v docker >/dev/null 2>&1; then

    if docker info >/dev/null 2>&1; then

        CONTAINERS=$(docker ps -aq --filter "ancestor=${IMAGE_NAME}" 2>/dev/null || true)
        IMAGE_EXISTS=false

        if docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
            IMAGE_EXISTS=true
        fi

        if [ -n "$CONTAINERS" ] || [ "$IMAGE_EXISTS" = true ]; then

            printf "\n"
            printf "${RED}Docker resources detected:${RESET}\n"

            if [ -n "$CONTAINERS" ]; then
                printf "${RED}  - NS2Nam containers${RESET}\n"
            fi

            if [ "$IMAGE_EXISTS" = true ]; then
                printf "${RED}  - Docker image: ${IMAGE_NAME}${RESET}\n"
            fi

            printf "\n"
            printf "${YELLOW}Do you want to remove these NS2Nam Docker resources? [y/N]: ${RESET}"
            read -r DOCKER_CONFIRMATION

            case "$DOCKER_CONFIRMATION" in
                y|Y|yes|YES|Yes)

                    if [ -n "$CONTAINERS" ]; then
                        printf "${CYAN}Removing NS2Nam containers...${RESET}\n"
                        docker rm -f $CONTAINERS >/dev/null
                    fi

                    if [ "$IMAGE_EXISTS" = true ]; then
                        printf "${CYAN}Removing NS2Nam Docker image...${RESET}\n"
                        docker image rm "$IMAGE_NAME" >/dev/null
                    fi

                    printf "${GREEN}NS2Nam Docker resources removed.${RESET}\n"
                    ;;

                *)
                    printf "${YELLOW}Docker resources were kept.${RESET}\n"
                    ;;
            esac

        else
            printf "${GREEN}No NS2Nam Docker resources found.${RESET}\n"
        fi

    else
        printf "${YELLOW}Docker Desktop is not running.${RESET}\n"
        printf "${YELLOW}Docker resources were not modified.${RESET}\n"
    fi

fi

# ------------------------------------------------------------
# Remove global ns2 command
# ------------------------------------------------------------

if [ -f "$GLOBAL_CMD" ] || [ -L "$GLOBAL_CMD" ]; then
    printf "${CYAN}Removing global ns2 command...${RESET}\n"
    rm -f "$GLOBAL_CMD"
fi

# Legacy global command from older installations
if [ -f "/usr/local/bin/ns2" ] || [ -L "/usr/local/bin/ns2" ]; then
    printf "${CYAN}Removing legacy global ns2 command...${RESET}\n"

    if [ -w "/usr/local/bin" ]; then
        rm -f "/usr/local/bin/ns2"
    else
        sudo rm -f "/usr/local/bin/ns2"
    fi
fi

# ------------------------------------------------------------
# Preserve simulations
# ------------------------------------------------------------

if [ -d "$INSTALL_DIR/simulations" ]; then

    printf "${CYAN}Preserving simulations...${RESET}\n"

    TEMP_DIR=$(mktemp -d)

    mv "$INSTALL_DIR/simulations" "$TEMP_DIR/simulations"

    rm -rf "$INSTALL_DIR"

    mkdir -p "$INSTALL_DIR"

    mv "$TEMP_DIR/simulations" "$INSTALL_DIR/simulations"

    rmdir "$TEMP_DIR"

else
    printf "${CYAN}Removing NS2Nam installation directory...${RESET}\n"
    rm -rf "$INSTALL_DIR"
fi

# ------------------------------------------------------------
# Remove only the NS2Nam PATH block
# ------------------------------------------------------------

remove_path_block() {
    local rc_file="$1"

    [ -f "$rc_file" ] || return 0

    sed -i '' '/^# NS2Nam$/,/^export PATH="\$HOME\/.local\/bin:\$PATH"$/d' "$rc_file"
}

remove_path_block "$HOME/.zshrc"
remove_path_block "$HOME/.bashrc"

# ------------------------------------------------------------
# Complete
# ------------------------------------------------------------

printf "\n"
printf "${GREEN}============================================================${RESET}\n"
printf "${GREEN}              NS2Nam uninstallation complete${RESET}\n"
printf "${GREEN}============================================================${RESET}\n"
printf "\n"

if [ -d "$INSTALL_DIR/simulations" ]; then
    printf "Your simulations were preserved at:\n"
    printf "  ${GREEN}%s${RESET}\n" "$INSTALL_DIR/simulations"
fi

printf "\n"
printf "Restart your terminal to refresh the PATH.\n"
printf "\n"
