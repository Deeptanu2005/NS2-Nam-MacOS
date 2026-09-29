# Compatibility

NS2-Nam for macOS runs NS-2 and NAM in a Docker container and displays NAM
through XQuartz. Compatibility depends on Docker Desktop and XQuartz working
on the host Mac.

## Platform support

| Mac platform | Container architecture | Notes |
| --- | --- | --- |
| Apple Silicon (arm64) | `linux/amd64` | Runs under Docker Desktop's amd64 emulation. |

The project targets macOS. It is not a native macOS build of NS-2 or NAM.
The included Dockerfile uses Debian 10 packages for these legacy tools.

## Requirements

- Docker Desktop installed and running.
- XQuartz installed for NAM's graphical window.
- An available Mac network interface with an IPv4 address on `en0` or `en1`;
  the launcher uses this address for the container's X11 display.
- `~/.Xauthority` present on the Mac; the launcher mounts it read-only into
  the container.

The installer enables local X11 connections with `xhost +localhost`. NAM
requires XQuartz to be running. NS-2 command-line simulations can run in the
container without displaying NAM.

## Known limitations

- Apple Silicon runs the `linux/amd64` image through emulation, so performance
  may differ from running on Intel hardware.
- The launcher currently checks `en0` and then `en1` for the Mac's IPv4
  address. Setups that use another interface may need a launcher adjustment.
- GUI output depends on XQuartz and the host's X11 display configuration.
