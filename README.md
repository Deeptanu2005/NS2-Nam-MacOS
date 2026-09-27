# NS2-Nam for macOS

A simple Docker-based NS-2 + NAM environment for macOS, including Apple Silicon support.

## Requirements

Install:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [XQuartz](https://www.xquartz.org/)

Docker Desktop must be running.

## Installation

Run:

```bash
curl -fsSL https://raw.githubusercontent.com/Deeptanu2005/NS2-Nam-MacOS/main/install.sh | bash
```

The installer automatically:

- Downloads NS2-Nam to `~/NS2Nam`
- Configures XQuartz
- Builds the Docker environment
- Installs the global `ns2` command
- Creates the `simulations` directory
- Verifies NS-2, NAM and Tcl

## Usage

Start the NS-2 environment:

```bash
ns2
```

Inside the environment:

```bash
ns
nam
tclsh
```

Run a simulation:

```bash
ns send_receive.tcl
```

NAM can be launched from Tcl:

```tcl
exec nam send_receive.nam &
```

## Directory

```text
~/NS2Nam/
├── Dockerfile
├── install.sh
├── uninstall.sh
├── bin/
│   └── ns2
└── simulations/
    └── send_receive.tcl
```

Put your own `.tcl` files inside:

```text
~/NS2Nam/simulations/
```

They are available inside the container at:

```text
/simulations
```

## Apple Silicon

NS-2 and NAM run using the `linux/amd64` architecture through Docker, allowing the environment to work on Apple Silicon Macs.

## Uninstallation

The uninstaller is intentionally not provided as a direct `curl | bash` command.

Download it first:

```bash
curl -fsSL https://raw.githubusercontent.com/Deeptanu2005/NS2-Nam-MacOS/main/uninstall.sh -o /tmp/ns2nam-uninstall.sh
```

Review and run:

```bash
bash /tmp/ns2nam-uninstall.sh
```

The uninstaller requires explicit confirmation.

It removes only NS2-Nam resources and preserves:

```text
~/NS2Nam/simulations/
```

Other Docker images, containers, volumes and Docker Desktop data are not removed.

## Credits

The Docker-based NS-2/NAM approach was developed with reference to:

[Ignema/ns2-nam-docker](https://github.com/Ignema/ns2-nam-docker)

This project adapts that approach for a simpler macOS installation workflow, including XQuartz configuration, Apple Silicon support and automated setup.

## License

Third-party software such as NS-2, NAM and Tcl remains subject to their respective licenses.
