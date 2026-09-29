FROM debian:10.9-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN printf 'deb http://archive.debian.org/debian buster main\n' \
        > /etc/apt/sources.list && \
    printf 'deb http://archive.debian.org/debian-security buster/updates main\n' \
        >> /etc/apt/sources.list && \
    apt-get -o Acquire::Check-Valid-Until=false update && \
    apt-get -o Acquire::Check-Valid-Until=false install -y \
        ns2 \
        nam \
        tclsh \
        x11-utils \
        xauth && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /simulations

CMD ["bash"]