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
The launcher uses the active XQuartz MIT-MAGIC-COOKIE from your Xauthority
database. It places that cookie in a temporary, account-readable file, mounts
the file read-only in the container, and removes it when `ns2` exits. The
project does not require `xhost` access grants.

## Why does `ns2` report that no X11 authentication cookie was found?

Start XQuartz and try again from a new Terminal session. If the error
continues, quit and reopen XQuartz so it can initialize its authentication
cookie. Also check that the `xauth` command is available; it is supplied with
XQuartz.

## Does it work on Apple Silicon?

Yes. Docker runs the NS-2/NAM image as `linux/amd64` on Apple Silicon.

## Where should I put my Tcl files?

Put them in `~/NS2Nam/simulations` on macOS. They appear in `/simulations`
inside the `ns2` environment and remain on your Mac between sessions.

## How do I uninstall it?

Follow the [uninstallation steps in the README](../README.md#uninstallation).
The uninstaller preserves your simulations and does not remove other Docker
images, containers, volumes, or Docker Desktop data.
