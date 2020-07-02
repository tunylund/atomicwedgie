#!/bin/sh
set -e

ACTION=$1
if [ "${ACTION}" == "lights-off" ]; then
  gcloud compute instances stop atomicwedgie atomicwedgie-turn
fi

if [ "${ACTION}" == "lights-on" ]; then
  gcloud compute instances start atomicwedgie atomicwedgie-turn
fi
