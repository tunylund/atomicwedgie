#!/bin/sh
set -e

./build.sh

export DOCKER_BUILDKIT=1
[[ -z "${AWS_ACCESS_KEY_ID}" ]] && AWS_PROFILE="--profile atomicwedgie" || AWS_PROFILE=""
AWS_REGION=eu-west-1

docker build -t atomicwedgie .
docker tag atomicwedgie:latest 219044013939.dkr.ecr.eu-west-1.amazonaws.com/atomicwedgie:latest

DOCKER_LOGIN=$(aws ${AWS_PROFILE} --region ${AWS_REGION} ecr get-login | sed 's|https://||' | sed 's|-e none||')
eval $DOCKER_LOGIN
docker push 219044013939.dkr.ecr.eu-west-1.amazonaws.com/atomicwedgie:latest

NUM_TASKS=`aws ${AWS_PROFILE} --region ${AWS_REGION} ecs list-tasks --cluster atomicwedgie | jq ".taskArns|length"`
if [ "$NUM_TASKS" -gt "0" ]; then
    aws ${AWS_PROFILE} --region ${AWS_REGION} ecs list-tasks --cluster atomicwedgie |
    jq ".taskArns[0]" | xargs -I {} aws ecs stop-task --cluster atomicwedgie --task {}
fi

aws ${AWS_PROFILE} \
    --region ${AWS_REGION} \
    ecs run-task \
    --cluster atomicwedgie \
    --count 1 \
    --launch-type EC2 \
    --task-definition atomicwedgie
