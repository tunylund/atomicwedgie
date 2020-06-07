#!/bin/sh
set -e

docker build -t atomicwedgie-turn .
docker run --network=host atomicwedgie-turn
