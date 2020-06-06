#!/bin/sh
set -e

USERNAME=$1
[ -z "$USERNAME" ] && echo "Please provide a username" && exit 1

PASSWORD=$2
[ -z "$PASSWORD" ] && echo "Please provide a password" && exit 1

docker run --network=host instrumentisto/coturn \
  --verbose \
  --fingerprint \
  --lt-cred-mech \
  --realm atomicwedgie \
  --user $USERNAME:$PASSWORD
