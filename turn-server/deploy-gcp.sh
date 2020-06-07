#!/bin/sh
set -e

export DOCKER_BUILDKIT=1

docker build -t atomicwedgie-turn .
docker tag atomicwedgie-turn:latest eu.gcr.io/atomicwedgie/atomicwedgie-turn:latest

docker push eu.gcr.io/atomicwedgie/atomicwedgie-turn:latest
gcloud compute instances update-container atomicwedgie-turn --container-image eu.gcr.io/atomicwedgie/atomicwedgie-turn:latest
