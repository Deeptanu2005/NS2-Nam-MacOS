# NS2-Nam for MacOS

A simple Docker-based NS-2 + NAM environment for macOS Apple Silicon support.

<img width="1774" height="887" alt="EA64F7E2-C41C-4D69-A30E-593BC2769E4E" src="https://github.com/user-attachments/assets/099bdbe4-b4a7-4f11-9828-ea7913e15ea1" />

## Requirements

Install:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [XQuartz](https://www.xquartz.org/)

Docker Desktop must be running. <br>
The device must be connected to the internet.

## Installation

Run:

```bash
curl -fsSL https://raw.githubusercontent.com/Deeptanu2005/NS2-Nam-MacOS/main/install.sh | bash
```

The installer automatically:

- Downloads the required NS2-Nam files to `~/NS2Nam`
- Configures XQuartz
- Builds the Docker environment
- Installs the global `ns2` command
- Creates the `simulations` directory
- Adds a sample simulation
- Verifies NS-2, NAM and Tcl

## Usage

Start the NS-2 environment:

```bash
ns2
```

Inside the environment, you can use `ns`, `nam` and `tclsh`.

Run a simulation:

```bash
ns send_receive.tcl
```

NAM can be launched from Tcl using `exec nam send_receive.nam &`.

## Directory

The installation creates:

`~/NS2Nam/` <br>
&nbsp;&nbsp;`├── Dockerfile`  
&nbsp;&nbsp;`├── bin/`  
&nbsp;&nbsp;`│    └── ns2`  
&nbsp;&nbsp;`└── simulations/`  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`   └── send_receive.tcl`

Put your own `.tcl` files inside:

`~/NS2Nam/simulations/`

Inside the Docker environment, this directory is available at:

`/simulations`

## Apple Silicon

NS-2 and NAM run using the `linux/amd64` architecture through Docker, allowing the environment to work on Apple Silicon Macs.

<img width="1774" height="887" alt="FBF42041-D77A-49E1-9881-6C1E23E50B85" src="https://github.com/user-attachments/assets/4ff3e3ca-2591-4644-8c08-7da7ff39d806" />


## Uninstallation

The uninstaller is intentionally not included in the normal installation process.

To uninstall, download the script manually:

```bash
curl -fsSL https://raw.githubusercontent.com/Deeptanu2005/NS2-Nam-MacOS/main/uninstall.sh -o /tmp/ns2nam-uninstall.sh
```

Review and run it:

```bash
bash /tmp/ns2nam-uninstall.sh
```

The uninstaller requires explicit confirmation before removing anything.

It removes only resources associated with this NS2-Nam installation and preserves your:

`~/NS2Nam/simulations/`

Other Docker images, containers, volumes and Docker Desktop data are not removed.

## Credits

The Docker-based NS-2/NAM approach was developed with reference to:

[Ignema/ns2-nam-docker](https://github.com/Ignema/ns2-nam-docker)

This project adapts that approach for a simpler macOS installation workflow, including XQuartz configuration, Apple Silicon support and automated setup.

## License

Third-party software such as NS-2, NAM and Tcl remains subject to their respective licenses.
