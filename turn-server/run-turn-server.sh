#!/bin/sh
set -e

docker run -d --network=host coturn/coturn

# docker build -t atomicwedgie-turn .
# docker run --network=host atomicwedgie-turn
