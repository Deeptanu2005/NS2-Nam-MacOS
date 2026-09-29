# Frequently Asked Questions

## What do I need before installing?

Install Docker Desktop and XQuartz, and make sure Docker Desktop is running.
The installer needs an internet connection to download the project files and
build the Docker image.

## How do I start NS-2?

Run `ns2` in Terminal. This opens an interactive shell in the Docker
environment. Your `~/NS2Nam/simulations` folder is available there as
`/simulations`.

## How do I run a simulation?

From the `ns2` shell, run a Tcl script by name, for example:

```bash
ns send_receive.tcl
```

The sample creates `send_receive.nam` and opens it in NAM when the simulation
finishes. You can also open it manually with `nam send_receive.nam`.

## Why does NAM fail to open?

Make sure XQuartz is installed and running, then start a new `ns2` session.
The installer enables local X11 connections by running `xhost +localhost`.
The launcher also requires `~/.Xauthority` to exist and mounts it read-only
into the container. If XQuartz was already running during installation, close
and reopen it, then run `ns2` again.

## Does the project configure X11 access?

Yes. The installer uses `xhost +localhost` to allow local clients, including
the Docker environment, to connect to XQuartz. The launcher mounts
`~/.Xauthority` read-only for X11 authentication. The uninstaller runs
`xhost -localhost` to revoke the grant.

## Does it work on Apple Silicon?

Yes. Docker runs the NS-2/NAM image as `linux/amd64` on Apple Silicon.

## Where should I put my Tcl files?

Put them in `~/NS2Nam/simulations` on macOS. They appear in `/simulations`
inside the `ns2` environment and remain on your Mac between sessions.

## How do I uninstall it?

Follow the [uninstallation steps in the README](../README.md#uninstallation).
The uninstaller preserves your simulations and does not remove other Docker
images, containers, volumes, or Docker Desktop data.
