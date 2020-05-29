#!/bin/sh
set -e

./build.sh

export DOCKER_BUILDKIT=1

docker build -t atomicwedgie .

docker tag atomicwedgie:latest 219044013939.dkr.ecr.eu-west-1.amazonaws.com/atomicwedgie:latest
eval $(aws --profile atomicwedgie --region eu-west-1 ecr get-login | sed 's|https://||' | sed 's|-e none||')
docker push 219044013939.dkr.ecr.eu-west-1.amazonaws.com/atomicwedgie:latest
aws --profile atomicwedgie --region eu-west-1 ecs list-tasks --cluster atomicwedgie |
    jq ".taskArns[0]" |
    xargs -I{} [ -z "{}" ] && aws ecs stop-task --cluster atomicwedgie --task {}
aws --profile atomicwedgie --region eu-west-1 ecs run-task --cluster atomicwedgie --count 1 --launch-type EC2 --task-definition atomicwedgie

docker tag atomicwedgie:latest eu.gcr.io/atomicwedgie/atomicwedgie:latest
docker push eu.gcr.io/atomicwedgie/atomicwedgie:latest
