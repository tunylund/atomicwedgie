#!/bin/sh
set -e

./build.sh

export DOCKER_BUILDKIT=1

docker build -t atomicwedgie .
docker tag atomicwedgie:latest eu.gcr.io/atomicwedgie/atomicwedgie:latest
docker push eu.gcr.io/atomicwedgie/atomicwedgie:latest

gcloud compute instances update-container atomicwedgie --container-image eu.gcr.io/atomicwedgie/atomicwedgie:latest
